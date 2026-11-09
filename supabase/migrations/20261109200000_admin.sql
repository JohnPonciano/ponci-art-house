-- PONCI · Painel de super admin: aprovação de pedidos, membros e curadoria
create table public.admins(email text primary key check (email = lower(email)), created_at timestamptz not null default now());
alter table public.admins enable row level security;
insert into public.admins(email) values ('jonathan.ponciano@icloud.com');

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as
$$ select exists(select 1 from public.admins where email = lower(coalesce((select auth.jwt())->>'email',''))) $$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Situação do membro
create type public.member_status as enum ('pending','active','suspended');
alter table public.profiles add column status public.member_status not null default 'pending';
update public.profiles set status = 'active';

-- Pedidos de convite: situação e código gerado
alter table public.access_requests
  add column status text not null default 'pending' check (status in ('pending','approved','rejected')),
  add column invite_code text,
  add column reviewed_at timestamptz;

-- Convites: códigos únicos (gerados na aprovação) ativam a conta direto
alter table public.invites
  add column auto_approve boolean not null default false,
  add column request_id uuid references public.access_requests on delete set null,
  add column note text not null default '';

-- Membro só enxerga a rede se estiver ativo
create or replace function public.is_member() returns boolean language sql stable security definer set search_path='' as
$$ select exists(select 1 from public.profiles where id = (select auth.uid()) and status = 'active') $$;

-- Cadastro: admin não precisa de convite nem de perfil; convites únicos ativam a conta
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare inv public.invites; v_code text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code','')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'full_name',''));
begin
  if exists(select 1 from public.admins where email = lower(coalesce(new.email,''))) then return new; end if;
  select * into inv from public.invites where code = v_code and uses_left > 0 for update;
  if inv.code is null then raise exception 'Convite inválido ou esgotado.' using errcode='P0001'; end if;
  if length(v_name) < 2 then raise exception 'Informe seu nome.' using errcode='P0001'; end if;
  update public.invites set uses_left = uses_left - 1 where code = inv.code;
  insert into public.profiles(id, role, member_code, display_name, city, practice, status)
  values (new.id, inv.role,
          case inv.role when 'artist' then 'ART-' else 'COL-' end || lpad(nextval('public.member_seq')::text, 4, '0'),
          case inv.role when 'artist' then coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''), v_name) else 'Colecionador verificado' end,
          coalesce(new.raw_user_meta_data->>'city',''), coalesce(new.raw_user_meta_data->>'practice',''),
          case when inv.auto_approve then 'active'::public.member_status else 'pending'::public.member_status end);
  insert into public.profile_private(id, full_name, email) values (new.id, v_name, coalesce(new.email,''));
  return new;
end $$;

-- Leitura total para o admin
create policy "admin lê pedidos" on public.access_requests for select to authenticated using ((select public.is_admin()));
create policy "admin lê convites" on public.invites for select to authenticated using ((select public.is_admin()));
create policy "admin lê perfis" on public.profiles for select to authenticated using ((select public.is_admin()));
create policy "admin lê privados" on public.profile_private for select to authenticated using ((select public.is_admin()));
create policy "admin lê obras" on public.works for select to authenticated using ((select public.is_admin()));
create policy "admin lê propostas" on public.proposals for select to authenticated using ((select public.is_admin()));
create policy "admin lê pedidos de compra" on public.orders for select to authenticated using ((select public.is_admin()));

create or replace function public._require_admin() returns void language plpgsql stable security definer set search_path='' as $$
begin if not public.is_admin() then raise exception 'Acesso restrito ao administrador.' using errcode='42501'; end if; end $$;

create or replace function public._new_code(p_role public.member_role) returns text language plpgsql security definer set search_path='' as $$
declare v text;
begin
  loop
    v := 'PONCI-' || case p_role when 'artist' then 'A' else 'C' end || '-' ||
         upper(substr(md5(gen_random_uuid()::text),1,6));
    exit when not exists(select 1 from public.invites where code = v);
  end loop;
  return v;
end $$;

create or replace function public.admin_approve_request(p_request uuid) returns text language plpgsql security definer set search_path='' as $$
declare r public.access_requests; v text;
begin
  perform public._require_admin();
  select * into r from public.access_requests where id = p_request for update;
  if r.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if r.status = 'approved' then return r.invite_code; end if;
  v := public._new_code(r.role);
  insert into public.invites(code, role, uses_left, auto_approve, request_id, note) values (v, r.role, 1, true, r.id, r.name || ' <' || r.email || '>');
  update public.access_requests set status='approved', invite_code=v, reviewed_at=now() where id = r.id;
  return v;
end $$;

create or replace function public.admin_reject_request(p_request uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  update public.access_requests set status='rejected', reviewed_at=now() where id = p_request and status = 'pending';
end $$;

create or replace function public.admin_set_member_status(p_member uuid, p_status public.member_status) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  update public.profiles set status = p_status where id = p_member;
  if not found then raise exception 'Membro não encontrado.' using errcode='P0001'; end if;
end $$;

create or replace function public.admin_review_work(p_work uuid, p_approve boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  if p_approve then
    update public.works set status='published' where id = p_work and status='review';
  else
    delete from public.works where id = p_work and status='review';
  end if;
  if not found then raise exception 'Obra não está em curadoria.' using errcode='P0001'; end if;
end $$;

create or replace function public.admin_create_invite(p_role public.member_role, p_uses int, p_note text default '', p_auto boolean default true)
returns text language plpgsql security definer set search_path='' as $$
declare v text;
begin
  perform public._require_admin();
  if p_uses < 1 or p_uses > 500 then raise exception 'Usos entre 1 e 500.' using errcode='P0001'; end if;
  v := public._new_code(p_role);
  insert into public.invites(code, role, uses_left, auto_approve, note) values (v, p_role, p_uses, p_auto, left(coalesce(p_note,''),200));
  return v;
end $$;

create or replace function public.admin_revoke_invite(p_code text) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  update public.invites set uses_left = 0 where code = p_code;
end $$;

revoke execute on function public._require_admin(), public._new_code(public.member_role) from public, anon, authenticated;
revoke execute on function public.admin_approve_request(uuid), public.admin_reject_request(uuid), public.admin_set_member_status(uuid,public.member_status),
  public.admin_review_work(uuid,boolean), public.admin_create_invite(public.member_role,int,text,boolean), public.admin_revoke_invite(text) from public, anon;
