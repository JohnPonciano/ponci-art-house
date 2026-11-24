#!/usr/bin/env bash
# Testes do banco: cria um banco novo, aplica as migrações em ordem e roda tests/db/*.test.sql.
# Requer um Postgres 16 local. Uso: PGHOST=/caminho/do/socket PGPORT=5499 tests/db/run.sh [filtro]
set -uo pipefail
cd "$(dirname "$0")/../.."
DB="ponci_t_$$"
psql_() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }
psql_ -d postgres -c "create database $DB" >/dev/null || exit 2
trap 'psql_ -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
psql_ -d "$DB" -f tests/db/00_stubs.sql >/dev/null || { echo "stubs falharam"; exit 2; }
for m in supabase/migrations/*.sql; do
  # pg_net e pg_cron são extensões do Supabase; aqui os esquemas net/cron vêm dos stubs
  out=$(sed -E 's/^create extension if not exists (pg_net|pg_cron).*$/-- (extensão do Supabase omitida no teste)/' "$m" | psql_ -d "$DB" 2>&1) || { echo "migração falhou: $m"; echo "$out" | grep -m3 ERROR; exit 2; }
done
echo "migrações: $(ls supabase/migrations/*.sql | wc -l) aplicadas"
ok=0; bad=0
for t in tests/db/*.test.sql; do
  [[ -n "${1:-}" && "$t" != *"$1"* ]] && continue
  out=$(psql -X -q -d "$DB" -v ON_ERROR_STOP=0 -f tests/db/helpers.sql -f "$t" 2>&1)
  o=$(grep -c "NOTICE:  OK" <<<"$out"); b=$(grep -cE "NOTICE:  FALHOU|ERROR:" <<<"$out")
  ok=$((ok+o)); bad=$((bad+b))
  echo "$(basename "$t"): $o ok, $b falhas"
  grep -E "FALHOU|ERROR:" <<<"$out" | sed 's/^/   /'
done
echo "total: $ok ok, $bad falhas"
[[ $bad -eq 0 ]]
