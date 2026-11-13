-- Notas da comunidade têm título (como no RedNote); o corpo continua opcional se houver foto.
alter table public.posts add column if not exists title text not null default '' constraint posts_title_len check (length(title) <= 90);
