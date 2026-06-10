-- ============================================================
-- AMO VIAJAR — Histórico de viagens realizadas por cliente
-- Execute no Supabase: SQL Editor > New Query > Run
-- ============================================================

create table if not exists participacoes (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id) on delete cascade,
  viagem_id   uuid references viagens(id) on delete set null,
  destino     text,
  data_viagem date,
  observacoes text,
  criado_em   timestamptz default now()
);

create index if not exists participacoes_cliente_idx on participacoes(cliente_id);
create index if not exists participacoes_viagem_idx  on participacoes(viagem_id);

alter table participacoes enable row level security;

create policy "participacoes_admin_all" on participacoes
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
