-- Pagamentos mais robustos (revisão geral):
-- 1) Um pagamento que não consegue ser aplicado (ex.: edição esgotada) não trava mais a fila inteira:
--    o erro fica anotado no pedido (status "problem") e os outros avisos seguem.
-- 2) Estorno ou chargeback de um pedido já pago vira "problem", para o admin ver em Pagamentos.
-- 3) O aviso público do Mercado Pago (mp_notify) tem um teto de consultas por minuto, para ninguém usar o
--    endereço para disparar consultas sem fim.

create or replace function public.mp_notify(p_payment_id text) returns void
language plpgsql security definer set search_path='' as $$
declare tok text := public._mp_token(); e public.mp_events;
begin
  if tok is null or p_payment_id !~ '^[0-9]{1,30}$' then return; end if;
  -- teto: no máximo 60 consultas à API por minuto (o Mercado Pago repete o aviso se não respondermos a tempo)
  if (select count(*) from public.mp_events where asked_at > now() - interval '1 minute') >= 60 then return; end if;
  insert into public.mp_events(payment_id) values (p_payment_id) on conflict (payment_id) do nothing;
  select * into e from public.mp_events where payment_id = p_payment_id for update;
  if e.status in ('refunded','cancelled','charged_back') then return; end if;   -- aprovado pode ser estornado depois: segue consultável
  if e.asked_at is not null and e.asked_at > now() - interval '10 seconds' then return; end if;
  update public.mp_events set asked_at = now(), updated_at = now(),
    req_id = net.http_get('https://api.mercadopago.com/v1/payments/' || p_payment_id, '{}'::jsonb, jsonb_build_object('Authorization', 'Bearer ' || tok), 20000)
  where payment_id = p_payment_id;
end $$;
revoke execute on function public.mp_notify(text) from public;
grant execute on function public.mp_notify(text) to anon, authenticated;

create or replace function public._mp_collect() returns int
language plpgsql security definer set search_path='' as $$
declare e public.mp_events; h record; j jsonb; c public.checkouts; n int := 0; st text;
begin
  for e in select * from public.mp_events where req_id is not null and (status is null or status not in ('refunded','cancelled','charged_back'))
           order by updated_at limit 50 for update skip locked loop
    select * into h from net._http_response where id = e.req_id;
    continue when h.id is null;
    begin j := h.content::jsonb; exception when others then j := null; end;
    if h.status_code <> 200 or j is null then
      update public.mp_events set status = 'error', detail = left(coalesce(j->>'message', h.error_msg, 'HTTP ' || h.status_code), 300), req_id = null, updated_at = now() where payment_id = e.payment_id;
      continue;
    end if;
    st := j->>'status';
    select * into c from public.checkouts where ref = j->>'external_reference';
    if st = 'approved' and c.id is not null and (j->>'transaction_amount')::numeric * 100 >= c.total_cents - 1 and (j->>'currency_id') = 'BRL' then
      begin
        perform public._checkout_paid(c.id, e.payment_id);
        st := 'approved_ok'; n := n + 1;
      exception when others then
        -- não deixa um pedido travar os outros: anota e manda para o admin resolver
        update public.checkouts set status = 'problem', mp_payment_id = e.payment_id, paid_at = coalesce(paid_at, now()), updated_at = now(),
          mp_error = left('Pago, mas não deu para liberar os itens: ' || sqlerrm, 300) where id = c.id;
        st := 'approved_ok';
      end;
    elsif st = 'approved' then
      st := 'approved_mismatch';
    elsif st in ('refunded','charged_back','cancelled') and c.id is not null and c.status = 'paid' and c.mp_payment_id = e.payment_id then
      update public.checkouts set status = 'problem', updated_at = now(),
        mp_error = case when st = 'charged_back' then 'Chargeback no Mercado Pago: segure o envio e fale com o comprador.'
                        else 'Pagamento estornado no Mercado Pago: confira se os itens devem ser cancelados.' end
      where id = c.id;
    end if;
    update public.mp_events set status = st, detail = left(coalesce(j->>'external_reference', '') || ' · ' || coalesce(j->>'transaction_amount', '') || ' · ' || coalesce(j->>'status_detail', ''), 300), req_id = null, updated_at = now()
    where payment_id = e.payment_id;
  end loop;
  return n;
end $$;
revoke execute on function public._mp_collect() from public, anon, authenticated;

-- função de gatilho não precisa ser chamável pela API
revoke execute on function public._buy_print_guard() from public, anon, authenticated;
