-- ============================================================
-- AMO VIAJAR — Funil comercial: novos status em leads
-- Execute no Supabase: SQL Editor > New Query > Run
-- ============================================================

alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check
  check (status in ('novo','contatado','negociando','reservado','pago','viajou','perdido'));
