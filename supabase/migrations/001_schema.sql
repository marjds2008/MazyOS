-- ============================================================
-- AMO VIAJAR — Schema inicial
-- Execute no Supabase: SQL Editor > New Query > Run
-- ============================================================

-- ── Extensões ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── VIAGENS ────────────────────────────────────────────────
create table if not exists viagens (
  id                  uuid primary key default gen_random_uuid(),
  titulo              text not null,
  destino             text not null,
  estado              text,
  categoria           text not null check (categoria in ('serra','praia','cultura','fe')),
  descricao_curta     text,
  descricao_completa  text,
  data_saida          date,
  data_retorno        date,
  horario_saida       text,
  local_embarque      text,
  pontos_embarque     text[],
  valor               numeric(10,2),
  valor_sinal         numeric(10,2),
  parcelamento        text,
  vagas_totais        integer default 0,
  vagas_disponiveis   integer default 0,
  incluso             text[],
  nao_incluso         text[],
  roteiro             text,
  observacoes         text,
  imagem_principal    text,
  galeria             text[],
  status              text not null default 'rascunho'
                        check (status in ('rascunho','aberta','ultimas_vagas','esgotada','encerrada')),
  criado_em           timestamptz default now(),
  atualizado_em       timestamptz default now()
);

-- ── LEADS ──────────────────────────────────────────────────
create table if not exists leads (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null,
  whatsapp            text not null,
  cidade              text,
  viagem_id           uuid references viagens(id) on delete set null,
  quantidade_pessoas  integer default 1,
  mensagem            text,
  origem              text default 'site',
  status              text not null default 'novo'
                        check (status in ('novo','contatado','negociando','fechado','perdido')),
  criado_em           timestamptz default now()
);

-- ── LISTA VIP ──────────────────────────────────────────────
create table if not exists lista_vip (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  whatsapp    text not null,
  cidade      text,
  origem      text default 'site',
  criado_em   timestamptz default now()
);

-- ── DEPOIMENTOS ────────────────────────────────────────────
create table if not exists depoimentos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text,
  imagem_url  text not null,
  ativo       boolean default true,
  ordem       integer default 0,
  destaque    boolean default false,
  criado_em   timestamptz default now()
);

-- ── GALERIA ────────────────────────────────────────────────
create table if not exists galeria (
  id          uuid primary key default gen_random_uuid(),
  titulo      text,
  destino     text,
  categoria   text,
  imagem_url  text not null,
  ativo       boolean default true,
  ordem       integer default 0,
  criado_em   timestamptz default now()
);

-- ── Trigger: atualiza atualizado_em em viagens ─────────────
create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end;
$$;

create or replace trigger viagens_atualizado_em
  before update on viagens
  for each row execute function set_atualizado_em();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table viagens     enable row level security;
alter table leads       enable row level security;
alter table lista_vip   enable row level security;
alter table depoimentos enable row level security;
alter table galeria     enable row level security;

-- ── VIAGENS: público lê apenas abertas/ultimas_vagas ───────
create policy "viagens_public_read" on viagens
  for select to anon, authenticated
  using (status in ('aberta','ultimas_vagas'));

create policy "viagens_admin_all" on viagens
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── LEADS: público insere, admin lê/edita ──────────────────
create policy "leads_public_insert" on leads
  for insert to anon, authenticated
  with check (true);

create policy "leads_admin_read" on leads
  for select to authenticated
  using (auth.role() = 'authenticated');

create policy "leads_admin_update" on leads
  for update to authenticated
  using (auth.role() = 'authenticated');

create policy "leads_admin_delete" on leads
  for delete to authenticated
  using (auth.role() = 'authenticated');

-- ── LISTA VIP: público insere, admin lê ────────────────────
create policy "lista_vip_public_insert" on lista_vip
  for insert to anon, authenticated
  with check (true);

create policy "lista_vip_admin_read" on lista_vip
  for select to authenticated
  using (auth.role() = 'authenticated');

create policy "lista_vip_admin_delete" on lista_vip
  for delete to authenticated
  using (auth.role() = 'authenticated');

-- ── DEPOIMENTOS: público lê ativos, admin controla tudo ────
create policy "depoimentos_public_read" on depoimentos
  for select to anon, authenticated
  using (ativo = true);

create policy "depoimentos_admin_all" on depoimentos
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── GALERIA: público lê ativas, admin controla tudo ────────
create policy "galeria_public_read" on galeria
  for select to anon, authenticated
  using (ativo = true);

create policy "galeria_admin_all" on galeria
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- (Execute separadamente no Supabase > Storage > New Bucket)
-- Criar 3 buckets públicos:
--   viagens    (public)
--   depoimentos (public)
--   galeria    (public)
-- ============================================================
