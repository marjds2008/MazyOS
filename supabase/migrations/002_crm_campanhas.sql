-- ============================================================
-- AMO VIAJAR — CRM + Campanhas WhatsApp
-- Execute no Supabase: SQL Editor > New Query > Run
-- ============================================================

-- ── CLIENTES (contatos unificados) ─────────────────────────
create table if not exists clientes (
  id                        uuid primary key default gen_random_uuid(),
  nome                      text not null,
  whatsapp                  text not null,
  cidade                    text,
  origem                    text default 'site',
  aceitou_receber_mensagens boolean default true,
  opt_out                   boolean default false,
  criado_em                 timestamptz default now(),
  atualizado_em             timestamptz default now()
);

create or replace trigger clientes_atualizado_em
  before update on clientes
  for each row execute function set_atualizado_em();

create index if not exists clientes_whatsapp_idx on clientes(whatsapp);
create index if not exists clientes_opt_out_idx  on clientes(opt_out, aceitou_receber_mensagens);

-- ── INTERESSES ─────────────────────────────────────────────
create table if not exists interesses (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid references clientes(id) on delete set null,
  viagem_id          uuid references viagens(id)  on delete set null,
  destino            text,
  categoria          text,
  quantidade_pessoas integer default 1,
  mensagem           text,
  status             text not null default 'novo'
                       check (status in ('novo','contatado','negociando','fechado','perdido')),
  criado_em          timestamptz default now()
);

create index if not exists interesses_cliente_idx  on interesses(cliente_id);
create index if not exists interesses_viagem_idx   on interesses(viagem_id);
create index if not exists interesses_status_idx   on interesses(status);
create index if not exists interesses_categoria_idx on interesses(categoria);

-- ── Adicionar link_publico em viagens ──────────────────────
alter table viagens add column if not exists link_publico text;

-- ── CAMPANHAS_WHATSAPP ─────────────────────────────────────
create table if not exists campanhas_whatsapp (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  viagem_id        uuid references viagens(id) on delete set null,
  segmento         text not null,
  mensagem         text not null,
  status           text not null default 'rascunho'
                     check (status in ('rascunho','pronta','enviada','cancelada')),
  criado_por       text,
  total_contatos   integer default 0,
  total_enviados   integer default 0,
  criado_em        timestamptz default now(),
  enviado_em       timestamptz
);

-- ── MENSAGENS_WHATSAPP ─────────────────────────────────────
create table if not exists mensagens_whatsapp (
  id           uuid primary key default gen_random_uuid(),
  campanha_id  uuid references campanhas_whatsapp(id) on delete cascade,
  cliente_id   uuid references clientes(id) on delete set null,
  whatsapp     text not null,
  mensagem     text not null,
  status_envio text not null default 'pendente'
                 check (status_envio in ('pendente','enviado','erro','ignorado_opt_out')),
  resposta_api jsonb,
  enviado_em   timestamptz,
  erro         text,
  criado_em    timestamptz default now()
);

create index if not exists mensagens_campanha_idx on mensagens_whatsapp(campanha_id);
create index if not exists mensagens_status_idx   on mensagens_whatsapp(status_envio);

-- ============================================================
-- RLS
-- ============================================================

alter table clientes           enable row level security;
alter table interesses         enable row level security;
alter table campanhas_whatsapp enable row level security;
alter table mensagens_whatsapp enable row level security;

-- clientes: site insere, admin lê/edita tudo
create policy "clientes_public_insert" on clientes
  for insert to anon, authenticated
  with check (true);

create policy "clientes_admin_all" on clientes
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- interesses: site insere, admin lê/edita tudo
create policy "interesses_public_insert" on interesses
  for insert to anon, authenticated
  with check (true);

create policy "interesses_admin_all" on interesses
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- campanhas: apenas admin
create policy "campanhas_admin_all" on campanhas_whatsapp
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- mensagens: apenas admin
create policy "mensagens_admin_all" on mensagens_whatsapp
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- OPT-OUT automático via SAIR
-- Quando cliente responde SAIR (processado pelo n8n),
-- atualizar opt_out = true via UPDATE nesta tabela.
-- ============================================================
