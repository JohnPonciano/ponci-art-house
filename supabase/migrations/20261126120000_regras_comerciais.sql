-- Regras comerciais configuráveis (Fase 0 da evolução).
-- 1) commerce_settings: versões imutáveis das regras (comissões, taxas). A vigente é a mais recente.
--    Só a comissão do original nasce preenchida (15%, a regra já praticada e escrita nos contratos).
--    Comissão de print, taxa de pagamento e imposto nascem VAZIAS: o admin preenche com os valores reais;
--    enquanto estiverem vazias, nenhum print pode ser publicado.
-- 2) orders.commission_pct: cada venda guarda a comissão do momento em que foi criada. Mudar a regra
--    não altera vendas antigas nem contratos já emitidos.

create table if not exists public.commerce_settings(
  id bigint generated always as identity primary key,
  original_commission_pct numeric(5,2) not null check (original_commission_pct >= 0 and original_commission_pct <= 50),
  print_commission_pct numeric(5,2) check (print_commission_pct >= 0 and print_commission_pct <= 60),
  payment_fee_pct numeric(5,2) check (payment_fee_pct >= 0 and payment_fee_pct <= 20),
  tax_pct numeric(5,2) check (tax_pct >= 0 and tax_pct <= 40),
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now(),
  created_by text
);
drop trigger if exists commerce_settings_immutable on public.commerce_settings;
create trigger commerce_settings_immutable before update or delete on public.commerce_settings for each row execute function public._immutable();
drop trigger if exists audit_commerce_settings on public.commerce_settings;
create trigger audit_commerce_settings after insert on public.commerce_settings for each row execute function public._audit();
alter table public.commerce_settings enable row level security;
drop policy if exists "regras: membros e admin leem" on public.commerce_settings;
create policy "regras: membros e admin leem" on public.commerce_settings for select to authenticated
  using ((select public.is_member()) or (select public.is_admin()));

insert into public.commerce_settings(original_commission_pct, note, created_by)
select 15, 'Regra praticada desde o lançamento: 15% sobre a venda do original, descontados no repasse.', 'migração'
where not exists (select 1 from public.commerce_settings);

-- regra vigente
create or replace function public.commerce_current() returns public.commerce_settings
language sql stable security definer set search_path='' as $$
  select * from public.commerce_settings order by id desc limit 1
$$;
revoke execute on function public.commerce_current() from public, anon;
grant execute on function public.commerce_current() to authenticated;

-- só a comissão do original, para textos públicos (home)
create or replace function public.original_commission_pct() returns numeric
language sql stable security definer set search_path='' as $$
  select original_commission_pct from public.commerce_settings order by id desc limit 1
$$;
grant execute on function public.original_commission_pct() to anon, authenticated;

-- admin publica uma nova versão das regras (as anteriores ficam no histórico)
create or replace function public.admin_set_commerce(p_original numeric, p_print numeric, p_payment_fee numeric, p_tax numeric, p_note text)
returns bigint language plpgsql security definer set search_path='' as $$
declare v bigint;
begin
  perform public._require_admin();
  if p_original is null then raise exception 'Informe a comissão do original.' using errcode='P0001'; end if;
  if coalesce(p_print, 0) + coalesce(p_payment_fee, 0) + coalesce(p_tax, 0) >= 90 then
    raise exception 'Comissão, taxa e imposto somados não podem chegar a 90%% do preço.' using errcode='P0001'; end if;
  insert into public.commerce_settings(original_commission_pct, print_commission_pct, payment_fee_pct, tax_pct, note, created_by)
  values (p_original, p_print, p_payment_fee, p_tax, left(btrim(coalesce(p_note, '')), 500), auth.jwt()->>'email')
  returning id into v;
  return v;
end $$;
revoke execute on function public.admin_set_commerce(numeric, numeric, numeric, numeric, text) from public, anon;
grant execute on function public.admin_set_commerce(numeric, numeric, numeric, numeric, text) to authenticated;

-- comissão gravada em cada venda (vendas antigas: 15%, que é o que os contratos delas dizem)
create or replace function public._original_commission_now() returns numeric
language sql stable security definer set search_path='' as $$ select public.original_commission_pct() $$;
alter table public.orders add column if not exists commission_pct numeric(5,2);
update public.orders set commission_pct = 15 where commission_pct is null;
alter table public.orders alter column commission_pct set default public._original_commission_now();
alter table public.orders alter column commission_pct set not null;

-- percentual escrito como no contrato: 15 -> "15", 12.5 -> "12,5"
create or replace function public._pct(p numeric) returns text language sql immutable set search_path='' as $$
  select replace(trim(trailing '.' from trim(trailing '0' from to_char(p, 'FM990.00'))), '.', ',')
$$;

-- Contrato: a comissão vem da venda, não de um número fixo.
create or replace function public._contract_text(p_order uuid) returns text language plpgsql stable security definer set search_path='' as $$
declare o public.orders; w public.works; ap public.profiles; bp public.profiles; ak public.kyc; bk public.kyc;
  t public.legal_documents; ca public.legal_documents; cc public.legal_documents; pv public.legal_documents;
  v_comm int; v_doc text;
begin
  select * into o from public.orders where id = p_order;
  select * into w from public.works where id = o.work_id;
  select * into ap from public.profiles where id = w.artist_id;
  select * into bp from public.profiles where id = o.buyer_id;
  select * into ak from public.kyc where user_id = w.artist_id;
  select * into bk from public.kyc where user_id = o.buyer_id;
  if ak.user_id is null or bk.user_id is null then
    raise exception 'As duas partes precisam ter o cadastro de identificação completo.' using errcode='P0001'; end if;
  select * into t from public.current_documents() where slug = 'termos';
  select * into pv from public.current_documents() where slug = 'privacidade';
  select * into ca from public.current_documents() where slug = 'contrato-artista';
  select * into cc from public.current_documents() where slug = 'contrato-colecionador';
  v_comm := round(o.amount * o.commission_pct / 100);
  return format(
E'# Instrumento particular de compra e venda de obra de arte com intermediação\n\n'
'Pedido **%s** · emitido em %s\n\n'
'## Partes\n\n'
'**VENDEDOR (ARTISTA):** %s, %s nº %s, membro %s, com endereço em %s/%s.\n\n'
'**COMPRADOR (COLECIONADOR):** %s, %s nº %s, membro %s, com endereço em %s/%s.\n\n'
'**INTERMEDIADORA:** [RAZÃO SOCIAL], CNPJ [CNPJ] ("PONCI").\n\n'
'A qualificação completa das partes consta do cadastro de identificação mantido pela INTERMEDIADORA.\n\n'
'## 1. Objeto\n\n'
'1.1. O VENDEDOR vende ao COMPRADOR a obra **%s**, de autoria de %s, %s, %s, %s × %s cm, %s, registrada na rede sob o nº %s.\n\n'
'## 2. Preço e pagamento\n\n'
'2.1. Preço total da obra: **%s** (%s).\n\n'
'2.2. O COMPRADOR paga o preço à instituição de pagamento parceira da INTERMEDIADORA, que o mantém em custódia até a confirmação de entrega e o término do prazo de arrependimento, quando aplicável. O pagamento deve ser concluído em até 48 horas após a assinatura deste instrumento.\n\n'
'2.3. Comissão de intermediação de ' || public._pct(o.commission_pct) || E'%%, devida pelo VENDEDOR e retida no repasse: %s. Valor líquido a repassar ao VENDEDOR: %s.\n\n'
'2.4. %s\n\n'
'## 3. Entrega e risco\n\n'
'3.1. O VENDEDOR embala a obra adequadamente e a despacha, com seguro pelo valor da obra, em até 5 dias úteis após a confirmação do pagamento em custódia, informando na plataforma a transportadora e o código de rastreio.\n\n'
'3.2. O risco da obra corre por conta do VENDEDOR até a entrega e passa ao COMPRADOR no recebimento. O COMPRADOR registra avarias pela plataforma, com fotos, em até 48 horas. A INTERMEDIADORA acompanha a entrega e media eventuais problemas.\n\n'
'## 4. Arrependimento e devolução\n\n'
'4.1. Sendo o COMPRADOR consumidor, pode desistir da compra em até 7 dias do recebimento (art. 49 do CDC), devolvendo a obra nas mesmas condições, com restituição integral do valor pago.\n\n'
'## 5. Autenticidade\n\n'
'5.1. %s\n\n'
'5.2. Concluída a entrega, a INTERMEDIADORA emite certificado de procedência numerado.\n\n'
'## 6. Direitos autorais\n\n'
'6.1. Este instrumento transfere a propriedade do suporte físico, não os direitos patrimoniais de autor (art. 37 da Lei 9.610/98). Nas revendas, aplica-se o direito de sequência (art. 38 da mesma lei).\n\n'
'## 7. Documentos incorporados\n\n'
'7.1. Integram este instrumento, nas versões vigentes na data de emissão:\n\n'
'- Termos de Uso, versão %s (SHA-256 %s)\n'
'- Política de Privacidade, versão %s (SHA-256 %s)\n'
'- Contrato de Intermediação — Artista, versão %s (SHA-256 %s)\n'
'- Condições Gerais de Compra — Colecionador, versão %s (SHA-256 %s)\n\n'
'## 8. Assinatura eletrônica e foro\n\n'
'8.1. As partes assinam este instrumento eletronicamente na plataforma PONCI, que registra data, hora, IP, navegador e a impressão digital SHA-256 deste texto, reconhecendo sua validade (Lei 14.063/2020 e art. 10, § 2º, da MP 2.200-2/2001).\n\n'
'8.2. Fica eleito o foro da comarca de [CIDADE/UF], ressalvado o direito do consumidor de demandar no foro de seu domicílio.\n',
    o.ref, to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY'),
    ak.legal_name, case ak.person_type when 'pf' then 'CPF' else 'CNPJ' end, public._mask_doc(ak.doc_number), ap.member_code, ak.city, ak.uf,
    bk.legal_name, case bk.person_type when 'pf' then 'CPF' else 'CNPJ' end, public._mask_doc(bk.doc_number), bp.member_code, bk.city, bk.uf,
    w.title, ap.display_name, w.year, w.medium, w.h, w.w, case when w.reproduction then coalesce(w.edition || ', ', '') || 'REPRODUÇÃO (não é a obra original)' else coalesce(w.edition, 'obra única') end, 'PNC ' || lpad(w.no::text, 3, '0'),
    public._brl(o.amount), case o.via when 'direct' then 'reserva pelo preço' else 'proposta aceita' end,
    public._brl(v_comm), public._brl(o.amount - v_comm),
    case when w.ship_included
      then 'O frete, a embalagem e o seguro de transporte estão incluídos no preço acima e correm por conta do VENDEDOR.'
      else 'O frete, com seguro pelo valor da obra, é pago pelo COMPRADOR, informado antes do pagamento e não integra o preço acima. A embalagem corre por conta do VENDEDOR.' end,
    case when w.reproduction
      then 'O objeto é uma REPRODUÇÃO (impressão ou cópia) e não a obra original. O VENDEDOR declara ser o autor da obra reproduzida ou deter os direitos para reproduzi-la e vendê-la, que o exemplar corresponde à descrição e está livre de ônus, e responde por evicção e vícios. Constatada divergência entre o exemplar e a descrição, o COMPRADOR tem direito à restituição integral.'
      else 'O VENDEDOR declara ser o autor da obra, que ela é original e está livre de ônus, e responde por evicção e vícios. Constatada falta de autenticidade, o COMPRADOR tem direito à restituição integral.' end,
    t.version, left(t.sha256, 16), pv.version, left(pv.sha256, 16), ca.version, left(ca.sha256, 16), cc.version, left(cc.sha256, 16));
end $$;
revoke execute on function public._contract_text(uuid) from public, anon, authenticated;
