-- 4 stories em sequência sobre a proteção contra coleta por IA (sáb 28/11, 11h, um por minuto)
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-ia-' || n || '.jpg'], '', ('2026-11-28 11:0' || (n - 1) || ':00-03')::timestamptz, 'Story · Proteção ' || n || '/4'
from generate_series(1, 4) n
where not exists(select 1 from public.ig_posts where label = 'Story · Proteção ' || n || '/4')
returning label, publish_at;
