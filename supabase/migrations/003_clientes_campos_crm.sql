-- ============================================================
-- AMO VIAJAR — Campos CRM no cadastro de clientes
-- Execute no Supabase: SQL Editor > New Query > Run
-- ============================================================

alter table clientes add column if not exists data_nascimento  date;
alter table clientes add column if not exists categoria_favorita text
  check (categoria_favorita in ('serra','praia','cultura','fe','interior_rj'));
alter table clientes add column if not exists observacoes text;
