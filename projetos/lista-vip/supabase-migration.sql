-- Rodar no Supabase SQL Editor
-- https://supabase.com/dashboard → projeto → SQL Editor

create table if not exists lista_vip (
  id         uuid        default gen_random_uuid() primary key,
  nome       text        not null,
  whatsapp   text        not null,
  cidade     text,
  created_at timestamptz default now()
);

-- Índice pra evitar duplicatas de WhatsApp
create unique index if not exists lista_vip_whatsapp_idx on lista_vip (whatsapp);

-- RLS ativado
alter table lista_vip enable row level security;

-- Qualquer visitante pode se inscrever (anon key no browser)
create policy "Inscrição pública"
  on lista_vip for insert
  with check (true);

-- Leitura bloqueada pra todo mundo (só via painel Supabase ou service role)
create policy "Leitura bloqueada"
  on lista_vip for select
  using (false);
