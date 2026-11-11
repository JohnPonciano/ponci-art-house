-- PONCI · Dados e responsabilidade: documentos versionados, aceites com evidência, cadastro de
-- identificação (KYC), contrato por venda com assinatura eletrônica, auditoria, solicitações (LGPD e
-- pós-venda) e relatório de compliance (Lei 9.613/98).

-- ============ utilitários ============
create or replace function public._immutable() returns trigger language plpgsql set search_path='' as
$$ begin raise exception 'Registro imutável.' using errcode='P0001'; end $$;

create or replace function public._hash_body() returns trigger language plpgsql set search_path='' as
$$ begin new.sha256 := encode(extensions.digest(new.body, 'sha256'), 'hex'); return new; end $$;

create or replace function public._brl(n int) returns text language sql immutable set search_path='' as
$$ select 'R$ ' || replace(to_char(n, 'FM999,999,999,990'), ',', '.') $$;

create or replace function public._mask_doc(d text) returns text language sql immutable set search_path='' as $$
  select case length(d)
    when 11 then '***.' || substr(d,4,3) || '.' || substr(d,7,3) || '-**'
    when 14 then '**.' || substr(d,3,3) || '.' || substr(d,6,3) || '/' || substr(d,9,4) || '-**'
    else '***' end
$$;

-- ============ documentos legais ============
create table public.legal_documents(
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug in ('termos','privacidade','contrato-artista','contrato-colecionador')),
  version int not null check (version > 0),
  title text not null,
  summary text not null default '',
  body text not null,
  sha256 text not null default '',
  published_at timestamptz not null default now(),
  published_by uuid,
  unique(slug, version)
);
create trigger legal_documents_hash before insert on public.legal_documents for each row execute function public._hash_body();
create trigger legal_documents_immutable before update or delete on public.legal_documents for each row execute function public._immutable();
alter table public.legal_documents enable row level security;
create policy "documentos são públicos" on public.legal_documents for select to anon, authenticated using (true);

create or replace function public.current_documents() returns setof public.legal_documents language sql stable set search_path='' as
$$ select distinct on (slug) * from public.legal_documents order by slug, version desc $$;

create or replace function public.required_slugs(p_role public.member_role) returns text[] language sql immutable set search_path='' as
$$ select array['termos','privacidade', case p_role when 'artist' then 'contrato-artista' else 'contrato-colecionador' end] $$;

-- ============ aceites (evidência) ============
create table public.acceptances(
  id bigint generated always as identity primary key,
  user_id uuid not null,                 -- sem FK: a evidência sobrevive à exclusão da conta
  email text not null,
  document_id uuid not null references public.legal_documents,
  doc_slug text not null, doc_version int not null, doc_sha256 text not null,
  method text not null check (method in ('cadastro','aceite','seed')),
  ip text, user_agent text,
  accepted_at timestamptz not null default now(),
  unique(user_id, document_id)
);
create index on public.acceptances(user_id);
create index on public.acceptances(document_id);
create trigger acceptances_immutable before update or delete on public.acceptances for each row execute function public._immutable();
alter table public.acceptances enable row level security;
create policy "aceites: dono e admin" on public.acceptances for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.docs_ok(p_uid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select not exists(
    select 1 from public.current_documents() d join public.profiles p on p.id = p_uid
    where d.slug = any(public.required_slugs(p.role))
      and not exists(select 1 from public.acceptances a where a.user_id = p_uid and a.document_id = d.id))
$$;

create or replace function public.pending_documents() returns setof public.legal_documents language sql stable security definer set search_path='' as $$
  select d.* from public.current_documents() d
  join public.profiles p on p.id = (select auth.uid())
  where d.slug = any(public.required_slugs(p.role))
    and not exists(select 1 from public.acceptances a where a.user_id = p.id and a.document_id = d.id)
  order by array_position(public.required_slugs(p.role), d.slug)
$$;

create or replace function public._accept(p_uid uuid, p_email text, p_docs uuid[], p_method text, p_ip text, p_ua text) returns int
language plpgsql security definer set search_path='' as $$
declare v_role public.member_role; n int := 0; d public.legal_documents;
begin
  select role into v_role from public.profiles where id = p_uid;
  if v_role is null then return 0; end if;
  for d in select * from public.current_documents() where id = any(p_docs) and slug = any(public.required_slugs(v_role)) loop
    insert into public.acceptances(user_id, email, document_id, doc_slug, doc_version, doc_sha256, method, ip, user_agent)
    values (p_uid, coalesce(p_email,''), d.id, d.slug, d.version, d.sha256, p_method, left(p_ip, 64), left(p_ua, 400))
    on conflict (user_id, document_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.accept_documents(p_docs uuid[], p_ip text default null, p_ua text default null) returns int
language plpgsql security definer set search_path='' as $$
begin
  return public._accept(auth.uid(), (select auth.jwt())->>'email', p_docs, 'aceite', p_ip, p_ua);
end $$;

-- ============ cadastro de identificação (KYC) ============
create or replace function public._cpf_valid(c text) returns boolean language plpgsql immutable set search_path='' as $$
declare s int; d int; i int;
begin
  if c is null or c !~ '^[0-9]{11}$' or c ~ '^(.)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substr(c,i,1)::int * (11 - i); end loop;
  d := (s * 10) % 11; if d = 10 then d := 0; end if;
  if d <> substr(c,10,1)::int then return false; end if;
  s := 0; for i in 1..10 loop s := s + substr(c,i,1)::int * (12 - i); end loop;
  d := (s * 10) % 11; if d = 10 then d := 0; end if;
  return d = substr(c,11,1)::int;
end $$;

-- CNPJ numérico e alfanumérico (IN RFB 2.229/2024): valor do caractere = código ASCII - 48
create or replace function public._cnpj_valid(c text) returns boolean language plpgsql immutable set search_path='' as $$
declare w1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2]; w2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2]; s int; d int; i int;
begin
  if c is null or c !~ '^[0-9A-Z]{12}[0-9]{2}$' or c ~ '^(.)\1{13}$' then return false; end if;
  s := 0; for i in 1..12 loop s := s + (ascii(substr(c,i,1)) - 48) * w1[i]; end loop;
  d := s % 11; d := case when d < 2 then 0 else 11 - d end;
  if d <> substr(c,13,1)::int then return false; end if;
  s := 0; for i in 1..13 loop s := s + (ascii(substr(c,i,1)) - 48) * w2[i]; end loop;
  d := s % 11; d := case when d < 2 then 0 else 11 - d end;
  return d = substr(c,14,1)::int;
end $$;

create table public.kyc(
  user_id uuid primary key references public.profiles on delete cascade,
  person_type text not null check (person_type in ('pf','pj')),
  legal_name text not null check (length(legal_name) between 3 and 200),
  doc_number text not null unique,
  birth_date date,
  phone text not null,
  cep text, street text, number text, complement text not null default '',
  district text, city text, uf text,
  occupation text not null default '',
  pep boolean not null default false,
  payout_info text not null default '',
  completed_at timestamptz,                 -- preenchido quando o cadastro completo (endereço etc.) é salvo
  updated_at timestamptz not null default now()
);
alter table public.kyc enable row level security;
create policy "kyc: dono e admin" on public.kyc for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.kyc_ok(p_uid uuid) returns boolean language sql stable security definer set search_path='' as
$$ select exists(select 1 from public.kyc where user_id = p_uid and completed_at is not null) $$;

create or replace function public.save_kyc(p jsonb) returns void language plpgsql security definer set search_path='' as $$
declare
  v_type text := p->>'person_type';
  v_doc text := upper(regexp_replace(coalesce(p->>'doc_number',''), '[^0-9A-Za-z]', '', 'g'));
  v_name text := trim(coalesce(p->>'legal_name',''));
  v_phone text := regexp_replace(coalesce(p->>'phone',''), '[^0-9+]', '', 'g');
  v_cep text := regexp_replace(coalesce(p->>'cep',''), '[^0-9]', '', 'g');
  v_uf text := upper(trim(coalesce(p->>'uf','')));
  v_birth date;
begin
  if not exists(select 1 from public.profiles where id = auth.uid()) then raise exception 'Perfil não encontrado.' using errcode='P0001'; end if;
  if v_type = 'pf' then
    if not public._cpf_valid(v_doc) then raise exception 'CPF inválido.' using errcode='P0001'; end if;
    begin v_birth := nullif(p->>'birth_date','')::date; exception when others then v_birth := null; end;
    if v_birth is null or v_birth > (current_date - interval '18 years') then raise exception 'É preciso ter 18 anos ou mais.' using errcode='P0001'; end if;
  elsif v_type = 'pj' then
    if not public._cnpj_valid(v_doc) then raise exception 'CNPJ inválido.' using errcode='P0001'; end if;
  else
    raise exception 'Escolha pessoa física ou jurídica.' using errcode='P0001';
  end if;
  if length(v_name) < 3 then raise exception 'Informe o nome completo ou a razão social.' using errcode='P0001'; end if;
  if length(v_phone) < 10 then raise exception 'Telefone inválido.' using errcode='P0001'; end if;
  if v_cep !~ '^[0-9]{8}$' then raise exception 'CEP inválido.' using errcode='P0001'; end if;
  if not (v_uf = any(array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'])) then
    raise exception 'UF inválida.' using errcode='P0001'; end if;
  if trim(coalesce(p->>'street','')) = '' or trim(coalesce(p->>'number','')) = '' or trim(coalesce(p->>'district','')) = '' or trim(coalesce(p->>'city','')) = '' then
    raise exception 'Endereço incompleto.' using errcode='P0001'; end if;
  if exists(select 1 from public.kyc where doc_number = v_doc and user_id <> auth.uid()) then
    raise exception 'Este documento já está cadastrado em outra conta.' using errcode='P0001'; end if;
  insert into public.kyc(user_id, person_type, legal_name, doc_number, birth_date, phone, cep, street, number, complement, district, city, uf, occupation, pep, payout_info, completed_at)
  values (auth.uid(), v_type, v_name, v_doc, case when v_type='pf' then v_birth end, v_phone, v_cep, trim(p->>'street'), trim(p->>'number'),
          trim(coalesce(p->>'complement','')), trim(p->>'district'), trim(p->>'city'), v_uf, left(trim(coalesce(p->>'occupation','')),120),
          coalesce((p->>'pep')::boolean, false), left(trim(coalesce(p->>'payout_info','')),200), now())
  on conflict (user_id) do update set person_type=excluded.person_type, legal_name=excluded.legal_name, doc_number=excluded.doc_number,
    birth_date=excluded.birth_date, phone=excluded.phone, cep=excluded.cep, street=excluded.street, number=excluded.number,
    complement=excluded.complement, district=excluded.district, city=excluded.city, uf=excluded.uf, occupation=excluded.occupation,
    pep=excluded.pep, payout_info=excluded.payout_info, completed_at=now(), updated_at=now();
end $$;

create or replace function public._require_ready() returns void language plpgsql stable security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles where id = auth.uid() and status = 'active') then
    raise exception 'Sua conta não está ativa.' using errcode='P0001'; end if;
  if not public.kyc_ok(auth.uid()) then
    raise exception 'Complete seus dados de identificação em Minha conta antes de negociar.' using errcode='P0001'; end if;
  if not public.docs_ok(auth.uid()) then
    raise exception 'Aceite a versão atual dos termos em Minha conta antes de continuar.' using errcode='P0001'; end if;
end $$;

-- artista só envia obra com cadastro e termos em dia
create policy "obras: só com cadastro e termos em dia" on public.works as restrictive for insert to authenticated
  with check ((select public.is_member()) and (select public.kyc_ok((select auth.uid()))) and (select public.docs_ok((select auth.uid()))));

-- ============ cadastro: aceite obrigatório ============
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare inv public.invites; v_code text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code','')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'full_name',''));
  v_cpf text := regexp_replace(coalesce(new.raw_user_meta_data->>'cpf',''), '[^0-9]', '', 'g');
  v_phone text := regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''), '[^0-9]', '', 'g');
  v_docs uuid[];
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
  -- CPF e telefone ficam só na tabela privada, não nos metadados da conta (que viajam no token de sessão)
  update auth.users set raw_user_meta_data = raw_user_meta_data - 'cpf' - 'phone' where id = new.id;
  begin
    select array_agg(x::uuid) into v_docs from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'accepted_documents','[]'::jsonb)) x;
  exception when others then v_docs := null; end;
  perform public._accept(new.id, new.email, coalesce(v_docs, '{}'), 'cadastro', null, new.raw_user_meta_data->>'user_agent');
  if not public.docs_ok(new.id) then
    raise exception 'É preciso aceitar os Termos de Uso, a Política de Privacidade e o contrato do seu perfil.' using errcode='P0001'; end if;
  return new;
end $$;

-- ============ contrato por venda ============
alter table public.orders add column delivered_at timestamptz;

create table public.contracts(
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default 'CTR-' || nextval('public.ref_seq'),
  order_id uuid unique not null references public.orders on delete restrict,
  body text not null,
  sha256 text not null default '',
  created_at timestamptz not null default now()
);
create trigger contracts_hash before insert on public.contracts for each row execute function public._hash_body();
create trigger contracts_immutable before update or delete on public.contracts for each row execute function public._immutable();

create table public.contract_signatures(
  id bigint generated always as identity primary key,
  contract_id uuid not null references public.contracts on delete restrict,
  party text not null check (party in ('comprador','artista','intermediadora')),
  user_id uuid,
  name text not null,
  doc_sha256 text not null,
  method text not null check (method in ('clique','automatica','seed')),
  ip text, user_agent text,
  signed_at timestamptz not null default now(),
  unique(contract_id, party)
);
create index on public.contract_signatures(contract_id);
create trigger contract_signatures_immutable before update or delete on public.contract_signatures for each row execute function public._immutable();

create or replace function public.can_see_order(p_order uuid) returns boolean language sql stable security definer set search_path='' as $$
  select (select public.is_admin()) or exists(select 1 from public.orders o join public.works w on w.id = o.work_id
    where o.id = p_order and (o.buyer_id = (select auth.uid()) or w.artist_id = (select auth.uid())))
$$;
alter table public.contracts enable row level security;
alter table public.contract_signatures enable row level security;
create policy "contratos: partes e admin" on public.contracts for select to authenticated using ((select public.can_see_order(order_id)));
create policy "assinaturas: partes e admin" on public.contract_signatures for select to authenticated
  using (exists(select 1 from public.contracts c where c.id = contract_id and (select public.can_see_order(c.order_id))));

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
  v_comm := round(o.amount * 0.15);
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
'2.3. Comissão de intermediação de 15%%, devida pelo VENDEDOR e retida no repasse: %s. Valor líquido a repassar ao VENDEDOR: %s.\n\n'
'2.4. Frete, embalagem especial e seguro são informados ao COMPRADOR antes do pagamento e não integram o preço acima.\n\n'
'## 3. Entrega e risco\n\n'
'3.1. O VENDEDOR disponibiliza a obra, adequadamente embalada, para coleta em até 5 dias úteis após a confirmação do pagamento em custódia.\n\n'
'3.2. O transporte é coordenado pela INTERMEDIADORA, com seguro. O risco passa ao COMPRADOR no recebimento. O COMPRADOR registra avarias pela plataforma em até 48 horas.\n\n'
'## 4. Arrependimento e devolução\n\n'
'4.1. Sendo o COMPRADOR consumidor, pode desistir da compra em até 7 dias do recebimento (art. 49 do CDC), devolvendo a obra nas mesmas condições, com restituição integral do valor pago.\n\n'
'## 5. Autenticidade\n\n'
'5.1. O VENDEDOR declara ser o autor da obra, que ela é original e está livre de ônus, e responde por evicção e vícios. Constatada falta de autenticidade, o COMPRADOR tem direito à restituição integral.\n\n'
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
    w.title, ap.display_name, w.year, w.medium, w.h, w.w, coalesce(w.edition, 'obra única'), 'PNC ' || lpad(w.no::text, 3, '0'),
    public._brl(o.amount), case o.via when 'direct' then 'reserva pelo preço' else 'proposta aceita' end,
    public._brl(v_comm), public._brl(o.amount - v_comm),
    t.version, left(t.sha256, 16), pv.version, left(pv.sha256, 16), ca.version, left(ca.sha256, 16), cc.version, left(cc.sha256, 16));
end $$;

create or replace function public._create_contract(p_order uuid, p_party text, p_signer uuid, p_method text, p_ip text, p_ua text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_hash text; v_name text;
begin
  insert into public.contracts(order_id, body) values (p_order, public._contract_text(p_order)) returning id, sha256 into v_id, v_hash;
  insert into public.contract_signatures(contract_id, party, user_id, name, doc_sha256, method)
  values (v_id, 'intermediadora', null, '[RAZÃO SOCIAL] (PONCI)', v_hash, 'automatica');
  if p_party is not null then
    select legal_name into v_name from public.kyc where user_id = p_signer;
    insert into public.contract_signatures(contract_id, party, user_id, name, doc_sha256, method, ip, user_agent)
    values (v_id, p_party, p_signer, v_name, v_hash, p_method, left(p_ip,64), left(p_ua,400));
  end if;
  return v_id;
end $$;

-- reserva: agora gera o contrato e registra a assinatura de quem fechou
-- versão antiga de _reserve (5 argumentos) não é mais usada
create or replace function public._reserve(p_work uuid, p_buyer uuid, p_amount int, p_via text, p_proposal uuid)
returns text language plpgsql security definer set search_path='' as
$$ begin raise exception 'Função obsoleta.' using errcode='P0001'; end $$;

create or replace function public._reserve(p_work uuid, p_buyer uuid, p_amount int, p_via text, p_proposal uuid, p_party text, p_signer uuid, p_ip text, p_ua text)
returns text language plpgsql security definer set search_path='' as $$
declare w public.works; v_order uuid; v_ref text;
begin
  select * into w from public.works where id = p_work for update;
  if w.id is null or w.status <> 'published' then raise exception 'A obra não está mais disponível.' using errcode='P0001'; end if;
  update public.works set status = 'reserved' where id = p_work;
  with c as (
    update public.proposals set status='closed', updated_at=now()
    where work_id = p_work and id is distinct from p_proposal and status in ('open','countered') returning id)
  insert into public.proposal_events(proposal_id, actor, kind, msg) select id, 'system', 'close', 'Obra reservada por outro membro.' from c;
  insert into public.orders(work_id, buyer_id, proposal_id, amount, via) values (p_work, p_buyer, p_proposal, p_amount, p_via) returning id, ref into v_order, v_ref;
  perform public._create_contract(v_order, p_party, p_signer, 'clique', p_ip, p_ua);
  return v_ref;
end $$;

create or replace function public.reserve_work(p_work uuid, p_ip text, p_ua text) returns text
language plpgsql security definer set search_path='' as $$
declare v_price int;
begin
  if (select public.my_role()) is distinct from 'buyer' then raise exception 'Somente colecionadores reservam obras.' using errcode='P0001'; end if;
  perform public._require_ready();
  select price into v_price from public.works where id = p_work;
  return public._reserve(p_work, auth.uid(), v_price, 'direct', null, 'comprador', auth.uid(), p_ip, p_ua);
end $$;

create or replace function public.make_proposal(p_work uuid, p_amount int, p_msg text default '')
returns text language plpgsql security definer set search_path='' as $$
declare w public.works; p public.proposals; me uuid := auth.uid();
begin
  if (select public.my_role()) is distinct from 'buyer' then raise exception 'Somente colecionadores fazem propostas.' using errcode='P0001'; end if;
  perform public._require_ready();
  select * into w from public.works where id = p_work;
  if w.id is null or w.status <> 'published' then raise exception 'A obra não está disponível.' using errcode='P0001'; end if;
  if p_amount < ceil(w.price * 0.5) then raise exception 'Propostas abaixo de 50%% do preço não são enviadas.' using errcode='P0001'; end if;
  if p_amount >= w.price then raise exception 'Para pagar o preço cheio, use a reserva pelo preço.' using errcode='P0001'; end if;
  select * into p from public.proposals where work_id = p_work and buyer_id = me and status in ('open','countered') for update;
  if p.id is null then
    insert into public.proposals(work_id, buyer_id) values (p_work, me) returning * into p;
  else
    update public.proposals set status='open', updated_at=now() where id = p.id;
  end if;
  insert into public.proposal_events(proposal_id, actor, kind, amount, msg) values (p.id, 'buyer', 'offer', p_amount, left(coalesce(p_msg,''),2000));
  return p.ref;
end $$;

create or replace function public.respond_proposal(p_proposal uuid, p_kind text, p_amount int, p_msg text, p_ip text, p_ua text)
returns text language plpgsql security definer set search_path='' as $$
declare p public.proposals; w public.works; me uuid := auth.uid(); v_actor text; v_cur int; v_ref text;
begin
  select * into p from public.proposals where id = p_proposal for update;
  if p.id is null then raise exception 'Proposta não encontrada.' using errcode='P0001'; end if;
  select * into w from public.works where id = p.work_id;
  if w.artist_id = me then v_actor := 'artist';
  elsif p.buyer_id = me then v_actor := 'buyer';
  else raise exception 'Sem permissão.' using errcode='42501'; end if;

  if v_actor = 'artist' and not (p.status = 'open' and p_kind in ('accept','decline','counter')) then
    raise exception 'Esta proposta não aguarda a sua resposta.' using errcode='P0001'; end if;
  if v_actor = 'buyer' and not ((p.status = 'countered' and p_kind in ('accept','decline')) or (p.status in ('open','countered') and p_kind = 'withdraw')) then
    raise exception 'Ação indisponível para esta proposta.' using errcode='P0001'; end if;
  if p_kind in ('accept','counter') then perform public._require_ready(); end if;

  select amount into v_cur from public.proposal_events where proposal_id = p.id and amount is not null order by id desc limit 1;

  if p_kind = 'counter' then
    if p_amount is null or p_amount < 500 or p_amount > w.price then raise exception 'Valor de contraproposta inválido.' using errcode='P0001'; end if;
    insert into public.proposal_events(proposal_id, actor, kind, amount, msg) values (p.id, 'artist', 'counter', p_amount, left(coalesce(p_msg,''),2000));
    update public.proposals set status='countered', updated_at=now() where id = p.id;
    return p.ref;
  elsif p_kind = 'accept' then
    v_ref := public._reserve(p.work_id, p.buyer_id, v_cur, 'proposal', p.id,
                             case v_actor when 'artist' then 'artista' else 'comprador' end, me, p_ip, p_ua);
    insert into public.proposal_events(proposal_id, actor, kind, amount, msg) values (p.id, v_actor, 'accept', v_cur, left(coalesce(p_msg,''),2000));
    update public.proposals set status='accepted', updated_at=now() where id = p.id;
    return v_ref;
  elsif p_kind = 'decline' then
    insert into public.proposal_events(proposal_id, actor, kind, msg) values (p.id, v_actor, 'decline', left(coalesce(p_msg,''),2000));
    update public.proposals set status='declined', updated_at=now() where id = p.id;
    return p.ref;
  else
    insert into public.proposal_events(proposal_id, actor, kind, msg) values (p.id, 'buyer', 'withdraw', '');
    update public.proposals set status='withdrawn', updated_at=now() where id = p.id;
    return p.ref;
  end if;
end $$;

-- versões antigas (sem IP/navegador) passam a chamar as novas
create or replace function public.reserve_work(p_work uuid) returns text language sql security definer set search_path='' as
$$ select public.reserve_work(p_work, null::text, null::text) $$;
create or replace function public.respond_proposal(p_proposal uuid, p_kind text, p_amount int default null, p_msg text default '') returns text
language sql security definer set search_path='' as
$$ select public.respond_proposal(p_proposal, p_kind, p_amount, p_msg, null::text, null::text) $$;

create or replace function public.sign_contract(p_contract uuid, p_ip text default null, p_ua text default null) returns void
language plpgsql security definer set search_path='' as $$
declare c public.contracts; o public.orders; w public.works; v_party text; v_name text;
begin
  select * into c from public.contracts where id = p_contract;
  if c.id is null then raise exception 'Contrato não encontrado.' using errcode='P0001'; end if;
  select * into o from public.orders where id = c.order_id;
  select * into w from public.works where id = o.work_id;
  if o.buyer_id = auth.uid() then v_party := 'comprador';
  elsif w.artist_id = auth.uid() then v_party := 'artista';
  else raise exception 'Sem permissão.' using errcode='42501'; end if;
  perform public._require_ready();
  select legal_name into v_name from public.kyc where user_id = auth.uid();
  insert into public.contract_signatures(contract_id, party, user_id, name, doc_sha256, method, ip, user_agent)
  values (c.id, v_party, auth.uid(), v_name, c.sha256, 'clique', left(p_ip,64), left(p_ua,400))
  on conflict (contract_id, party) do nothing;
end $$;

create or replace function public.advance_order(p_order uuid) returns int language plpgsql security definer set search_path='' as $$
declare o public.orders; v_signed int;
begin
  select * into o from public.orders where id = p_order and buyer_id = auth.uid() for update;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if o.stage >= 3 then return 3; end if;
  if o.stage = 0 then
    select count(*) into v_signed from public.contract_signatures s join public.contracts c on c.id = s.contract_id
      where c.order_id = o.id and s.party in ('comprador','artista');
    if v_signed < 2 then raise exception 'O contrato precisa estar assinado pelas duas partes antes do pagamento.' using errcode='P0001'; end if;
  end if;
  update public.orders set stage = stage + 1, delivered_at = case when stage + 1 = 3 then now() else delivered_at end where id = o.id;
  if o.stage + 1 = 3 then update public.works set status='sold' where id = o.work_id; end if;
  return o.stage + 1;
end $$;

-- ============ solicitações (LGPD e pós-venda) ============
create table public.member_requests(
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default 'SOL-' || nextval('public.ref_seq'),
  user_id uuid not null,
  order_id uuid references public.orders on delete set null,
  kind text not null check (kind in ('acesso','correcao','exclusao','portabilidade','revogacao','arrependimento','problema','outro')),
  details text not null default '' check (length(details) <= 4000),
  status text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','negada')),
  response text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on public.member_requests(user_id);
create index on public.member_requests(order_id);
alter table public.member_requests enable row level security;
create policy "solicitações: dono e admin" on public.member_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.create_request(p_kind text, p_details text, p_order uuid default null) returns text
language plpgsql security definer set search_path='' as $$
declare o public.orders; v_ref text;
begin
  if not exists(select 1 from public.profiles where id = auth.uid()) then raise exception 'Perfil não encontrado.' using errcode='P0001'; end if;
  if p_kind in ('arrependimento','problema') then
    select * into o from public.orders where id = p_order and buyer_id = auth.uid();
    if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
    if p_kind = 'arrependimento' then
      if o.delivered_at is null then raise exception 'O prazo de arrependimento começa na entrega.' using errcode='P0001'; end if;
      if now() > o.delivered_at + interval '7 days' then raise exception 'O prazo de 7 dias para arrependimento terminou.' using errcode='P0001'; end if;
      if exists(select 1 from public.member_requests where order_id = o.id and kind = 'arrependimento' and status in ('aberta','em_andamento')) then
        raise exception 'Já existe um pedido de arrependimento em andamento para esta compra.' using errcode='P0001'; end if;
    end if;
  else
    p_order := null;
  end if;
  insert into public.member_requests(user_id, order_id, kind, details) values (auth.uid(), p_order, p_kind, left(coalesce(p_details,''),4000)) returning ref into v_ref;
  return v_ref;
end $$;

create or replace function public.admin_update_request(p_id uuid, p_status text, p_response text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  if p_status not in ('aberta','em_andamento','concluida','negada') then raise exception 'Situação inválida.' using errcode='P0001'; end if;
  update public.member_requests set status = p_status, response = left(coalesce(p_response,''),4000), updated_at = now(),
    resolved_at = case when p_status in ('concluida','negada') then now() else null end where id = p_id;
end $$;

-- ============ admin: publicar documento ============
create or replace function public.admin_publish_document(p_slug text, p_title text, p_summary text, p_body text) returns int
language plpgsql security definer set search_path='' as $$
declare v int;
begin
  perform public._require_admin();
  if length(coalesce(p_body,'')) < 200 then raise exception 'Texto muito curto.' using errcode='P0001'; end if;
  if exists(select 1 from public.current_documents() where slug = p_slug and body = p_body and title = p_title) then
    select version into v from public.current_documents() where slug = p_slug; return v; end if;
  select coalesce(max(version), 0) + 1 into v from public.legal_documents where slug = p_slug;
  insert into public.legal_documents(slug, version, title, summary, body, published_by) values (p_slug, v, p_title, coalesce(p_summary,''), p_body, auth.uid());
  return v;
end $$;

-- ============ compliance (Lei 9.613/98 · IPHAN) ============
create or replace function public.admin_compliance(p_min int default 10000)
returns table(order_ref text, created_at timestamptz, amount int, stage int, via text, work_title text,
              artist_code text, artist_name text, artist_doc text, artist_pep boolean,
              buyer_code text, buyer_name text, buyer_doc text, buyer_pep boolean, buyer_city text, buyer_uf text,
              contract_ref text, signatures int)
language plpgsql stable security definer set search_path='' as $$
begin
  perform public._require_admin();
  return query
  select o.ref, o.created_at, o.amount, o.stage, o.via, w.title,
         ap.member_code, ak.legal_name, ak.doc_number, ak.pep,
         bp.member_code, bk.legal_name, bk.doc_number, bk.pep, bk.city, bk.uf,
         c.ref, (select count(*)::int from public.contract_signatures s where s.contract_id = c.id and s.party <> 'intermediadora')
  from public.orders o
  join public.works w on w.id = o.work_id
  join public.profiles ap on ap.id = w.artist_id
  join public.profiles bp on bp.id = o.buyer_id
  left join public.kyc ak on ak.user_id = w.artist_id
  left join public.kyc bk on bk.user_id = o.buyer_id
  left join public.contracts c on c.order_id = o.id
  where o.amount >= p_min
  order by o.created_at desc;
end $$;

-- ============ trilha de auditoria ============
create table public.audit_log(
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_email text,
  action text not null,
  table_name text not null,
  row_id text,
  changes jsonb
);
create index on public.audit_log(at desc);
create index on public.audit_log(table_name, row_id);
alter table public.audit_log enable row level security;
create policy "auditoria: admin" on public.audit_log for select to authenticated using ((select public.is_admin()));
create trigger audit_log_immutable before update or delete on public.audit_log for each row execute function public._immutable();
revoke insert, update, delete, truncate on public.audit_log from anon, authenticated;

create or replace function public._audit() returns trigger language plpgsql security definer set search_path='' as $$
declare v_old jsonb; v_new jsonb; v_changes jsonb; v_id text;
  v_hide text[] := array['body','doc_number','birth_date','phone','cep','street','number','complement','payout_info','user_agent'];
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old) - v_hide; end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new) - v_hide; end if;
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('de', v_old->k, 'para', v_new->k)) into v_changes
    from jsonb_object_keys(v_new) k where (v_old->k) is distinct from (v_new->k);
    if v_changes is null then return new; end if;
  else
    v_changes := coalesce(v_new, v_old);
  end if;
  v_id := coalesce(v_new->>'ref', v_old->>'ref', v_new->>'id', v_old->>'id', v_new->>'user_id', v_old->>'user_id', v_new->>'code', v_old->>'code');
  insert into public.audit_log(actor, actor_email, action, table_name, row_id, changes)
  values (auth.uid(), (select auth.jwt())->>'email', lower(tg_op), tg_table_name, v_id, v_changes);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['works','proposals','orders','profiles','kyc','invites','access_requests','contracts',
                           'contract_signatures','acceptances','member_requests','legal_documents','admins'] loop
    execute format('create trigger audit_%s after insert or update or delete on public.%I for each row execute function public._audit()', t, t);
  end loop;
end $$;

create or replace function public.admin_email() returns boolean language sql stable security definer set search_path='' as
$$ select exists(select 1 from public.admins where email = lower(coalesce((select auth.jwt())->>'email',''))) $$;

-- ============ permissões ============
revoke execute on function public._accept(uuid,text,uuid[],text,text,text), public._require_ready(), public._contract_text(uuid),
  public._create_contract(uuid,text,uuid,text,text,text), public._reserve(uuid,uuid,int,text,uuid,text,uuid,text,text),
  public._reserve(uuid,uuid,int,text,uuid), public._audit(),
  public._hash_body(), public._immutable() from public, anon, authenticated;
revoke execute on function public.accept_documents(uuid[],text,text), public.save_kyc(jsonb), public.reserve_work(uuid,text,text),
  public.respond_proposal(uuid,text,int,text,text,text), public.sign_contract(uuid,text,text), public.create_request(text,text,uuid),
  public.admin_update_request(uuid,text,text), public.admin_publish_document(text,text,text,text), public.admin_compliance(int),
  public.pending_documents(), public.docs_ok(uuid), public.kyc_ok(uuid), public.can_see_order(uuid) from public, anon;
grant execute on function public.current_documents() to anon, authenticated;
revoke execute on function public.admin_email() from public, anon;
