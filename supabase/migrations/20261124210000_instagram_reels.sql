-- Fila do Instagram: reels (vídeo MP4 com capa). O Instagram processa o vídeo antes de publicar,
-- então o disparador insiste na publicação por até 30 minutos enquanto ele diz "ainda não está pronto".
alter table public.ig_posts drop constraint if exists ig_posts_kind_check;
alter table public.ig_posts add constraint ig_posts_kind_check check (kind in ('image','carousel','story','reel'));
alter table public.ig_posts add column if not exists cover_url text;

drop function if exists public.admin_ig_save(uuid, text[], text, timestamptz, text, boolean);
create or replace function public.admin_ig_save(p_id uuid, p_media text[], p_caption text, p_publish_at timestamptz, p_label text default '',
  p_story boolean default false, p_reel boolean default false, p_cover text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v uuid := p_id; n int := coalesce(array_length(p_media, 1), 0); u text;
  k text := case when coalesce(p_reel, false) then 'reel' when coalesce(p_story, false) then 'story' when n > 1 then 'carousel' else 'image' end;
begin
  perform public._require_admin();
  if n < 1 or n > 10 then raise exception 'De 1 a 10 imagens.' using errcode='P0001'; end if;
  if k in ('story', 'reel') and n > 1 then raise exception 'Story e reel levam um arquivo só.' using errcode='P0001'; end if;
  foreach u in array p_media loop
    if k = 'reel' and u !~ '^https://[^ ]+\.mp4(\?[^ ]*)?$' then raise exception 'Reel precisa de um link https de vídeo MP4.' using errcode='P0001'; end if;
    if k <> 'reel' and u !~ '^https://[^ ]+\.(jpe?g)(\?[^ ]*)?$' then raise exception 'Use links https de imagens JPEG (o Instagram só aceita JPEG): %', u using errcode='P0001'; end if;
  end loop;
  if p_cover is not null and p_cover <> '' and p_cover !~ '^https://[^ ]+\.(jpe?g)(\?[^ ]*)?$' then raise exception 'A capa precisa ser um link https de imagem JPEG.' using errcode='P0001'; end if;
  if length(coalesce(p_caption, '')) > 2200 then raise exception 'Legenda com mais de 2.200 caracteres.' using errcode='P0001'; end if;
  if (select count(*) from regexp_matches(coalesce(p_caption, ''), '#[[:alnum:]_]+', 'g')) > 30 then
    raise exception 'O Instagram aceita até 30 hashtags.' using errcode='P0001'; end if;
  if p_publish_at is null then raise exception 'Escolha data e hora.' using errcode='P0001'; end if;
  if v is null then
    insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
    values (k, p_media, case when k = 'story' then '' else coalesce(p_caption, '') end, p_publish_at, coalesce(p_label, ''), nullif(p_cover, ''))
    returning id into v;
  else
    update public.ig_posts set kind = k, media = p_media, caption = case when k = 'story' then '' else coalesce(p_caption, '') end,
      publish_at = p_publish_at, label = coalesce(nullif(p_label, ''), label), cover_url = nullif(p_cover, ''), updated_at = now(),
      status = case when status = 'failed' then 'scheduled' else status end, error = case when status = 'failed' then null else error end
    where id = v and status in ('scheduled','failed','cancelled');
    if not found then raise exception 'Esta publicação já saiu ou está saindo agora.' using errcode='P0001'; end if;
  end if;
  return v;
end $$;
revoke execute on function public.admin_ig_save(uuid, text[], text, timestamptz, text, boolean, boolean, text) from public, anon;
grant execute on function public.admin_ig_save(uuid, text[], text, timestamptz, text, boolean, boolean, text) to authenticated;

create or replace function public.ig_tick() returns void language plpgsql security definer set search_path='' as $$
declare
  s public.ig_settings; tok text; r public.ig_posts; base text := 'https://graph.facebook.com/v21.0/'; hdr jsonb;
  bad record; ids bigint[]; kids text[]; i int; v text; body jsonb;
begin
  select * into s from public.ig_settings where id = 1;
  select decrypted_secret into tok from vault.decrypted_secrets where name = 'ig_access_token' limit 1;
  update public.ig_settings set last_tick_at = now(),
    last_message = case when tok is null then 'Sem token: conecte a conta na tela Instagram do admin.' else last_message end where id = 1;
  if tok is null or s.ig_user_id is null then return; end if;
  hdr := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || tok);

  -- passou muito da hora: não publica no escuro
  update public.ig_posts set status = 'failed', error = 'O horário passou há mais de 24 h. Ajuste a data e mande de novo.', updated_at = now()
  where status = 'scheduled' and publish_at < now() - interval '24 hours';

  -- começa as que chegaram na hora (até 3 por minuto)
  for r in select * from public.ig_posts where status = 'scheduled' and publish_at <= now() order by publish_at limit 3 for update skip locked loop
    if r.kind = 'reel' then
      update public.ig_posts set status = 'publishing', step = 'container', attempts = attempts + 1, step_at = now(), error = null, updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media',
          jsonb_strip_nulls(jsonb_build_object('media_type', 'REELS', 'video_url', r.media[1], 'caption', r.caption, 'share_to_feed', true, 'cover_url', r.cover_url)),
          '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    elsif r.kind = 'story' then
      update public.ig_posts set status = 'publishing', step = 'container', attempts = attempts + 1, step_at = now(), error = null, updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('image_url', r.media[1], 'media_type', 'STORIES'), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    elsif r.kind = 'carousel' then
      ids := '{}';
      for i in 1..array_length(r.media, 1) loop
        ids := ids || net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('image_url', r.media[i], 'is_carousel_item', true), '{}'::jsonb, hdr, 30000);
      end loop;
      update public.ig_posts set status = 'publishing', step = 'children', req_ids = ids, attempts = attempts + 1, step_at = now(), error = null, updated_at = now() where id = r.id;
    else
      update public.ig_posts set status = 'publishing', step = 'container', attempts = attempts + 1, step_at = now(), error = null, updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('image_url', r.media[1], 'caption', r.caption), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    end if;
  end loop;

  -- avança as que estão no meio do caminho
  for r in select * from public.ig_posts where status = 'publishing' and step_at < now() - interval '2 seconds' for update skip locked loop
    -- ainda esperando resposta?
    if exists(select 1 from unnest(r.req_ids) q(id) where not exists(select 1 from net._http_response h where h.id = q.id)) then
      if r.step_at < now() - interval '15 minutes' then
        perform public._ig_fail(r.id, 'O Instagram não respondeu a tempo.' || case when r.step in ('publish','permalink') then ' Confira no perfil se o post saiu antes de tentar de novo.' else '' end);
      end if;
      continue;
    end if;
    -- alguma resposta com erro?
    select h.status_code, h.content, h.timed_out, h.error_msg into bad from net._http_response h
      where h.id = any(r.req_ids) and (h.timed_out or h.status_code is null or h.status_code >= 300) limit 1;
    if found then
      begin body := bad.content::jsonb; exception when others then body := null; end;
      v := coalesce(body->'error'->>'error_user_msg', body->'error'->>'message', bad.error_msg, 'Erro ' || coalesce(bad.status_code::text, 'de rede'));
      if r.step = 'permalink' then  -- o post já saiu; só não veio o link
        update public.ig_posts set status = 'published', step = null, published_at = now(), req_ids = '{}', updated_at = now() where id = r.id;
      elsif r.step = 'publish' and (position('9007' in coalesce(bad.content, '')) > 0 or lower(v) like '%not ready%' or lower(v) like '%not available%')
            and r.step_at > now() - (case when r.kind = 'reel' then interval '30 minutes' else interval '10 minutes' end) then
        -- mídia ainda processando: tenta publicar de novo no próximo minuto
        update public.ig_posts set req_ids = array[net.http_post(base || s.ig_user_id || '/media_publish', jsonb_build_object('creation_id', r.container_id), '{}'::jsonb, hdr, 30000)], updated_at = now()
        where id = r.id;
      else
        perform public._ig_fail(r.id, v || case when r.step = 'publish' and bad.timed_out then ' Confira no perfil se o post saiu antes de tentar de novo.' else '' end);
      end if;
      continue;
    end if;
    -- tudo certo: próximo passo
    if r.step = 'children' then
      select array_agg((h.content::jsonb)->>'id' order by array_position(r.req_ids, h.id)) into kids from net._http_response h where h.id = any(r.req_ids);
      update public.ig_posts set child_ids = kids, step = 'container', step_at = now(), updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('media_type', 'CAROUSEL', 'children', array_to_string(kids, ','), 'caption', r.caption), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    elsif r.step = 'container' then
      select (h.content::jsonb)->>'id' into v from net._http_response h where h.id = r.req_ids[1];
      update public.ig_posts set container_id = v, step = 'publish', step_at = now(), updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media_publish', jsonb_build_object('creation_id', v), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    elsif r.step = 'publish' then
      select (h.content::jsonb)->>'id' into v from net._http_response h where h.id = r.req_ids[1];
      update public.ig_posts set ig_media_id = v, step = 'permalink', step_at = now(), updated_at = now(),
        req_ids = array[net.http_get(base || v, jsonb_build_object('fields', 'permalink'), hdr, 30000)]
      where id = r.id;
    elsif r.step = 'permalink' then
      select (h.content::jsonb)->>'permalink' into v from net._http_response h where h.id = r.req_ids[1];
      update public.ig_posts set permalink = v, status = 'published', step = null, published_at = now(), req_ids = '{}', updated_at = now() where id = r.id;
    end if;
  end loop;
end $$;
revoke execute on function public.ig_tick() from public, anon, authenticated;
