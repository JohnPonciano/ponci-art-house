-- Convites de membros: cada artista ou colecionador ativo pode convidar até 3 pessoas.
-- Quem entra por convite de membro fica pendente até a PONCI aprovar (a rede continua fechada).
alter table public.invites add column if not exists invited_by uuid references public.profiles on delete set null;
alter table public.invites add column if not exists invitee_name text not null default '';
create index if not exists invites_invited_by_idx on public.invites(invited_by);

create policy "membro lê os próprios convites" on public.invites for select to authenticated using (invited_by = (select auth.uid()));

create or replace function public.member_create_invite(p_role public.member_role, p_name text) returns text
language plpgsql security definer set search_path='' as $$
declare v text; me uuid := auth.uid(); n text := left(trim(coalesce(p_name,'')), 80);
begin
  if not public.is_member() then raise exception 'Sua conta precisa estar ativa para convidar.' using errcode='P0001'; end if;
  if not public.docs_ok(me) then raise exception 'Aceite os documentos vigentes antes de convidar.' using errcode='P0001'; end if;
  if length(n) < 2 then raise exception 'Informe o nome de quem você vai convidar.' using errcode='P0001'; end if;
  perform 1 from public.profiles where id = me for update;  -- evita corrida entre dois cliques
  if (select count(*) from public.invites where invited_by = me) >= 3 then raise exception 'Você já usou seus 3 convites.' using errcode='P0001'; end if;
  v := public._new_code(p_role);
  insert into public.invites(code, role, uses_left, auto_approve, note, invited_by, invitee_name)
  values (v, p_role, 1, false, 'Convite de ' || (select member_code from public.profiles where id = me) || ' para ' || n, me, n);
  return v;
end $$;

-- cancelar um convite ainda não usado devolve a vaga
create or replace function public.member_cancel_invite(p_code text) returns void language plpgsql security definer set search_path='' as $$
begin
  delete from public.invites where code = upper(trim(p_code)) and invited_by = auth.uid() and uses_left > 0;
  if not found then raise exception 'Convite não encontrado ou já usado.' using errcode='P0001'; end if;
end $$;

-- card público do convite (para a página e a imagem de compartilhamento): só o que o convidado precisa ver
create or replace function public.invite_card(p_code text) returns json language sql stable security definer set search_path='' as $$
  select case when i.code is null then json_build_object('valid', false) else json_build_object(
    'valid', i.uses_left > 0, 'role', i.role, 'invitee', i.invitee_name,
    'inviter', case when p.id is null then 'PONCI' when p.role = 'artist' or p.show_name then p.display_name else 'Um colecionador da rede' end,
    'inviter_role', coalesce(p.role::text, 'ponci'), 'inviter_city', coalesce(p.city, ''), 'inviter_practice', case when p.role = 'artist' then p.practice else '' end,
    'inviter_code', case when p.role = 'artist' then p.member_code else null end) end
  from (select 1) x left join public.invites i on i.code = upper(trim(p_code)) left join public.profiles p on p.id = i.invited_by
$$;

-- o cadastro já vem com o nome escrito por quem convidou
create or replace function public.invite_prefill(p_code text) returns json language sql stable security definer set search_path='' as $$
  select case
    when i.code is null then null
    when r.id is not null and r.status = 'approved' then json_build_object('role', i.role, 'name', r.name, 'email', r.email, 'city', r.city, 'practice', r.practice)
    when i.invited_by is not null and i.invitee_name <> '' then json_build_object('role', i.role, 'name', i.invitee_name)
    else json_build_object('role', i.role)
  end
  from (select 1) x
  left join public.invites i on i.code = upper(trim(p_code)) and i.uses_left > 0
  left join public.access_requests r on r.id = i.request_id
$$;

revoke execute on function public.member_create_invite(public.member_role, text), public.member_cancel_invite(text) from public, anon;
grant execute on function public.member_create_invite(public.member_role, text), public.member_cancel_invite(text) to authenticated;
grant execute on function public.invite_card(text), public.invite_prefill(text) to anon, authenticated;

-- o card mostra a obra mais recente quando quem convida é artista (nunca obras de terceiros para colecionadores)
create or replace function public.invite_card(p_code text) returns json language sql stable security definer set search_path='' as $$
  select case when i.code is null then json_build_object('valid', false) else json_build_object(
    'valid', i.uses_left > 0, 'role', i.role, 'invitee', i.invitee_name,
    'inviter', case when p.id is null then 'PONCI' when p.role = 'artist' or p.show_name then p.display_name else 'Um colecionador da rede' end,
    'inviter_role', coalesce(p.role::text, 'ponci'), 'inviter_city', coalesce(p.city, ''), 'inviter_practice', case when p.role = 'artist' then p.practice else '' end,
    'art', case when p.role = 'artist' then (select json_build_object('path', w.image_path, 'w', w.img_w, 'h', w.img_h, 'title', w.title)
       from public.works w where w.artist_id = p.id and w.image_path is not null and w.status in ('published','reserved','sold') order by w.created_at desc limit 1) end) end
  from (select 1) x left join public.invites i on i.code = upper(trim(p_code)) left join public.profiles p on p.id = i.invited_by
$$;
