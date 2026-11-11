-- Cadastro pelo link do convite: dados do pedido já vêm preenchidos e o e-mail do convite dispensa confirmação.

-- Quem tem o código (enviado só para a pessoa aprovada) recebe os dados que ela mesma informou no pedido.
create or replace function public.invite_prefill(p_code text) returns json language sql stable security definer set search_path='' as $$
  select case
    when i.code is null then null
    when r.id is not null and r.status = 'approved' then json_build_object('role', i.role, 'name', r.name, 'email', r.email, 'city', r.city, 'practice', r.practice)
    else json_build_object('role', i.role)
  end
  from (select 1) x
  left join public.invites i on i.code = upper(trim(p_code)) and i.uses_left > 0
  left join public.access_requests r on r.id = i.request_id
$$;
grant execute on function public.invite_prefill(text) to anon, authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare inv public.invites; v_code text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code','')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'full_name',''));
  v_cpf text := regexp_replace(coalesce(new.raw_user_meta_data->>'cpf',''), '[^0-9]', '', 'g');
  v_phone text := regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''), '[^0-9]', '', 'g');
  v_docs uuid[];
  v_req_email text;
begin
  if exists(select 1 from public.admins where email = lower(coalesce(new.email,''))) then return new; end if;
  select * into inv from public.invites where code = v_code and uses_left > 0 for update;
  if inv.code is null then raise exception 'Convite inválido ou esgotado.' using errcode='P0001'; end if;
  if length(v_name) < 3 then raise exception 'Informe seu nome completo.' using errcode='P0001'; end if;
  if not public._cpf_valid(v_cpf) then raise exception 'CPF inválido.' using errcode='P0001'; end if;
  if v_phone !~ '^55[0-9]{10,11}$' then raise exception 'Telefone inválido.' using errcode='P0001'; end if;
  if exists(select 1 from public.kyc where doc_number = v_cpf) then raise exception 'CPF já cadastrado.' using errcode='P0001'; end if;
  update public.invites set uses_left = uses_left - 1 where code = inv.code;
  insert into public.profiles(id, role, member_code, display_name, city, practice, status)
  values (new.id, inv.role,
          case inv.role when 'artist' then 'ART-' else 'COL-' end || lpad(nextval('public.member_seq')::text, 4, '0'),
          case inv.role when 'artist' then coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''), v_name) else 'Colecionador verificado' end,
          coalesce(new.raw_user_meta_data->>'city',''), coalesce(new.raw_user_meta_data->>'practice',''),
          case when inv.auto_approve then 'active'::public.member_status else 'pending'::public.member_status end);
  insert into public.profile_private(id, full_name, email) values (new.id, v_name, coalesce(new.email,''));
  insert into public.kyc(user_id, person_type, legal_name, doc_number, phone) values (new.id, 'pf', v_name, v_cpf, '+' || v_phone);
  -- e-mail igual ao do pedido aprovado: o convite chegou nesse endereço, então ele já está comprovado
  select lower(r.email) into v_req_email from public.access_requests r where r.id = inv.request_id;
  update auth.users set raw_user_meta_data = raw_user_meta_data - 'cpf' - 'phone',
    email_confirmed_at = case when v_req_email is not null and v_req_email = lower(new.email) then coalesce(email_confirmed_at, now()) else email_confirmed_at end
  where id = new.id;
  begin
    select array_agg(x::uuid) into v_docs from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'accepted_documents','[]'::jsonb)) x;
  exception when others then v_docs := null; end;
  perform public._accept(new.id, new.email, coalesce(v_docs, '{}'), 'cadastro', null, new.raw_user_meta_data->>'user_agent');
  if not public.docs_ok(new.id) then
    raise exception 'É preciso aceitar os Termos de Uso, a Política de Privacidade e o contrato do seu perfil.' using errcode='P0001'; end if;
  return new;
end $$;
