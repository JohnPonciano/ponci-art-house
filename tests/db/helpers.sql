-- Funções de apoio dos testes (temporárias, por sessão). Cada verificação imprime OK ou FALHOU.
create or replace function pg_temp.como(uid text, email text, aal text default 'aal1') returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false);
  perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',email,'aal',aal)::text, false); end $$;
create or replace function pg_temp.espera_erro(sql text, trecho text, nome text) returns void language plpgsql as $$
begin execute sql; raise notice 'FALHOU %: deveria dar erro', nome;
exception when others then
  if position(trecho in sqlerrm) > 0 then raise notice 'OK %', nome; else raise notice 'FALHOU %: erro inesperado: %', nome, sqlerrm; end if; end $$;
create or replace function pg_temp.confere(cond boolean, nome text) returns void language plpgsql as $$
begin if coalesce(cond, false) then raise notice 'OK %', nome; else raise notice 'FALHOU %', nome; end if; end $$;
