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

-- RLS: ninguém lê/escreve direto pelo cliente (só via API com service role)
alter table lista_vip enable row level security;
