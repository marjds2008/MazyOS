-- ============================================================
-- Parceria Premiada — Schema inicial
-- Sprint 3: Integração Supabase
-- Versão: 001
-- Data: junho/2026
-- ============================================================
-- CHECKLIST DE TESTES (após aplicar no Supabase Dashboard)
--
-- [ ] Inserção via RPC create_participant_with_number funciona
-- [ ] Duplicidade por WhatsApp é bloqueada (retorna erro claro)
-- [ ] Duplicidade por Instagram é bloqueada (retorna erro claro)
-- [ ] Número sequencial começa em 1 e incrementa por campanha
-- [ ] Campanha A e campanha B têm sequências independentes
-- [ ] get_participant_confirmation retorna apenas campos seguros
-- [ ] RLS bloqueia SELECT direto em participants (sem policy anon)
-- [ ] RLS bloqueia SELECT direto em lucky_numbers (sem policy anon)
-- [ ] Campaigns têm SELECT público
-- [ ] Campo participant_count em campaigns incrementa corretamente
-- [ ] audit_logs registra cada novo cadastro
-- ============================================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Função auxiliar: auto-update de updated_at ────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Tabela: campaigns ─────────────────────────────────────────────────────────

CREATE TABLE campaigns (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT        UNIQUE NOT NULL,
  title             TEXT        NOT NULL,
  subtitle          TEXT,
  status            TEXT        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('upcoming', 'active', 'ended')),
  hero_image        TEXT,
  start_date        TIMESTAMPTZ,
  end_date          TIMESTAMPTZ,
  draw_date         TIMESTAMPTZ,
  trip_date         TIMESTAMPTZ,
  main_color        TEXT        DEFAULT '#4D0AA4',
  accent_color      TEXT        DEFAULT '#F5A623',
  whatsapp_number   TEXT,
  instagram_url     TEXT,
  official_post_url TEXT,
  -- Contador atômico para gerar números sequenciais por campanha
  participant_count INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Tabela: participants ──────────────────────────────────────────────────────

CREATE TABLE participants (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id   UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  email         TEXT,
  whatsapp      TEXT        NOT NULL,   -- normalizado: somente dígitos
  instagram     TEXT        NOT NULL,   -- normalizado: lowercase, sem @
  city          TEXT,
  state         TEXT,
  accepted_lgpd BOOLEAN     NOT NULL DEFAULT FALSE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'validated', 'winner', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicidade: mesmo WhatsApp não pode participar duas vezes da mesma campanha
-- mas pode participar de campanhas diferentes
CREATE UNIQUE INDEX idx_participants_campaign_whatsapp
  ON participants(campaign_id, whatsapp);

-- Unicidade: mesmo Instagram por campanha (mesmo critério do WhatsApp)
CREATE UNIQUE INDEX idx_participants_campaign_instagram
  ON participants(campaign_id, instagram);

CREATE INDEX idx_participants_campaign_id ON participants(campaign_id);
CREATE INDEX idx_participants_status       ON participants(status);
CREATE INDEX idx_participants_created_at   ON participants(created_at);

CREATE TRIGGER participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Tabela: lucky_numbers ─────────────────────────────────────────────────────

CREATE TABLE lucky_numbers (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id    UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  participant_id UUID        NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  number         INTEGER     NOT NULL,   -- sequencial por campanha: 1, 2, 3...
  status         TEXT        NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'winner', 'cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Número único por campanha (garante integridade mesmo em race conditions)
  UNIQUE(campaign_id, number)
);

CREATE INDEX idx_lucky_numbers_campaign_id    ON lucky_numbers(campaign_id);
CREATE INDEX idx_lucky_numbers_participant_id ON lucky_numbers(participant_id);
CREATE INDEX idx_lucky_numbers_campaign_number ON lucky_numbers(campaign_id, number);

-- ── Tabela: partners ─────────────────────────────────────────────────────────

CREATE TABLE partners (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  instagram  TEXT,
  website    TEXT,
  logo       TEXT,
  category   TEXT,
  status     TEXT        NOT NULL DEFAULT 'active'
             CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabela: campaign_partners ─────────────────────────────────────────────────

CREATE TABLE campaign_partners (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  partner_id  UUID        NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(campaign_id, partner_id)
);

CREATE INDEX idx_campaign_partners_campaign_id ON campaign_partners(campaign_id);
CREATE INDEX idx_campaign_partners_partner_id  ON campaign_partners(partner_id);

-- ── Tabela: whatsapp_logs ─────────────────────────────────────────────────────
-- HOOK n8n: Esta tabela alimenta o workflow n8n de disparo de mensagens.
-- Registros com status='pending' são consumidos pelo n8n a cada ciclo.
-- O n8n chama a Evolution API para envio via WhatsApp.

CREATE TABLE whatsapp_logs (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID        REFERENCES participants(id) ON DELETE SET NULL,
  campaign_id    UUID        REFERENCES campaigns(id) ON DELETE SET NULL,
  message        TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_logs_participant_id ON whatsapp_logs(participant_id);
CREATE INDEX idx_whatsapp_logs_status         ON whatsapp_logs(status);
CREATE INDEX idx_whatsapp_logs_campaign_id    ON whatsapp_logs(campaign_id);

-- ── Tabela: referrals ─────────────────────────────────────────────────────────

CREATE TABLE referrals (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id            UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  participant_id         UUID        NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  invited_participant_id UUID        NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(campaign_id, participant_id, invited_participant_id)
);

CREATE INDEX idx_referrals_campaign_id    ON referrals(campaign_id);
CREATE INDEX idx_referrals_participant_id ON referrals(participant_id);

-- ── Tabela: draw_results ──────────────────────────────────────────────────────

CREATE TABLE draw_results (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id    UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  participant_id UUID        REFERENCES participants(id) ON DELETE SET NULL,
  federal_number TEXT,        -- número sorteado pela Loteria Federal
  winning_number INTEGER,     -- número da sorte vencedor
  draw_date      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_draw_results_campaign_id ON draw_results(campaign_id);

-- ── Tabela: audit_logs ────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name  TEXT        NOT NULL,
  record_id   UUID,
  action      TEXT        NOT NULL,  -- INSERT, UPDATE, DELETE, RPC
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at   ON audit_logs(created_at);

-- ============================================================
-- RPC: create_participant_with_number
-- Operação 100% atômica dentro de uma transaction:
--   1. Valida campanha (slug + status)
--   2. Verifica duplicidade (WhatsApp e Instagram)
--   3. Insere participante
--   4. Incrementa participant_count (lock de linha serializa concorrência)
--   5. Insere lucky_number com o número sequencial
--   6. Registra audit_log
-- ============================================================

CREATE OR REPLACE FUNCTION create_participant_with_number(
  p_campaign_slug TEXT,
  p_name          TEXT,
  p_whatsapp      TEXT,
  p_instagram     TEXT,
  p_city          TEXT,
  p_state         TEXT,
  p_email         TEXT,
  p_accepted_lgpd BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id    UUID;
  v_participant_id UUID;
  v_number         INTEGER;
  v_instagram      TEXT;
  v_whatsapp       TEXT;
BEGIN
  -- Normalizar dados de entrada
  v_instagram := lower(trim(regexp_replace(p_instagram, '^@+', '')));
  v_whatsapp  := regexp_replace(p_whatsapp, '[^0-9]', '', 'g');

  -- Validações básicas
  IF NOT p_accepted_lgpd THEN
    RETURN json_build_object('error', 'É necessário aceitar o regulamento para participar.', 'code', 'LGPD_NOT_ACCEPTED');
  END IF;

  IF length(v_whatsapp) < 10 OR length(v_whatsapp) > 11 THEN
    RETURN json_build_object('error', 'WhatsApp inválido. Informe DDD + número.', 'code', 'INVALID_WHATSAPP');
  END IF;

  IF length(v_instagram) < 2 THEN
    RETURN json_build_object('error', 'Instagram inválido.', 'code', 'INVALID_INSTAGRAM');
  END IF;

  -- 1. Buscar e bloquear linha da campanha (FOR UPDATE serializa o contador)
  SELECT id INTO v_campaign_id
  FROM campaigns
  WHERE slug = p_campaign_slug AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Campanha não encontrada ou encerrada.', 'code', 'CAMPAIGN_NOT_FOUND');
  END IF;

  -- 2. Verificar duplicidade por WhatsApp na mesma campanha
  IF EXISTS (
    SELECT 1 FROM participants
    WHERE campaign_id = v_campaign_id AND whatsapp = v_whatsapp
  ) THEN
    RETURN json_build_object(
      'error', 'Este WhatsApp já está cadastrado nessa campanha.',
      'code',  'DUPLICATE_WHATSAPP'
    );
  END IF;

  -- 3. Verificar duplicidade por Instagram na mesma campanha
  IF EXISTS (
    SELECT 1 FROM participants
    WHERE campaign_id = v_campaign_id AND instagram = v_instagram
  ) THEN
    RETURN json_build_object(
      'error', 'Este Instagram já está cadastrado nessa campanha.',
      'code',  'DUPLICATE_INSTAGRAM'
    );
  END IF;

  -- 4. Inserir participante
  INSERT INTO participants (campaign_id, name, email, whatsapp, instagram, city, state, accepted_lgpd)
  VALUES (
    v_campaign_id,
    trim(p_name),
    NULLIF(trim(p_email), ''),
    v_whatsapp,
    v_instagram,
    NULLIF(trim(p_city), ''),
    NULLIF(p_state, ''),
    p_accepted_lgpd
  )
  RETURNING id INTO v_participant_id;

  -- 5. Gerar número sequencial atômico
  --    O FOR UPDATE na campanha garante que apenas um processo por vez
  --    passa por aqui para a mesma campanha — sem race condition.
  UPDATE campaigns
  SET participant_count = participant_count + 1
  WHERE id = v_campaign_id
  RETURNING participant_count INTO v_number;

  -- 6. Inserir lucky_number
  INSERT INTO lucky_numbers (campaign_id, participant_id, number)
  VALUES (v_campaign_id, v_participant_id, v_number);

  -- 7. Audit log
  INSERT INTO audit_logs (table_name, record_id, action, description)
  VALUES (
    'participants',
    v_participant_id,
    'INSERT',
    'Cadastro via formulário web · campanha: ' || p_campaign_slug || ' · número: ' || v_number
  );

  -- ── HOOK n8n (futuro) ─────────────────────────────────────────────────────
  -- Ativar quando n8n + Evolution API estiverem configurados:
  --
  -- INSERT INTO whatsapp_logs (participant_id, campaign_id, status)
  -- VALUES (v_participant_id, v_campaign_id, 'pending');
  --
  -- O workflow n8n consulta whatsapp_logs WHERE status='pending'
  -- e dispara via Evolution API com o número de boas-vindas.
  -- ──────────────────────────────────────────────────────────────────────────

  -- ── HOOK CRM (futuro) ─────────────────────────────────────────────────────
  -- Notificar CRM externo via pg_notify (capturado pelo n8n ou worker):
  --
  -- PERFORM pg_notify('pp_new_participant',
  --   json_build_object(
  --     'participant_id', v_participant_id,
  --     'campaign_slug',  p_campaign_slug,
  --     'number',         v_number
  --   )::text
  -- );
  -- ──────────────────────────────────────────────────────────────────────────

  -- ── HOOK Tags / Segmentação (futuro) ──────────────────────────────────────
  -- Inserir tags automáticas baseadas em cidade/estado:
  -- Ex: INSERT INTO participant_tags (participant_id, tag) VALUES (v_participant_id, 'RJ');
  -- ──────────────────────────────────────────────────────────────────────────

  RETURN json_build_object(
    'success',        true,
    'participant_id', v_participant_id,
    'number',         v_number,
    'campaign_id',    v_campaign_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'error', 'Cadastro duplicado detectado. Verifique se já participou.',
      'code',  'DUPLICATE_ERROR'
    );
  WHEN OTHERS THEN
    RAISE WARNING 'create_participant_with_number error: % %', SQLERRM, SQLSTATE;
    RETURN json_build_object(
      'error', 'Erro interno. Tente novamente em instantes.',
      'code',  'INTERNAL_ERROR'
    );
END;
$$;

-- ============================================================
-- RPC: get_participant_confirmation
-- Retorna apenas campos seguros para a página de confirmação.
-- NÃO expõe WhatsApp, email ou Instagram do participante.
-- ============================================================

CREATE OR REPLACE FUNCTION get_participant_confirmation(p_participant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'name',           p.name,
    'city',           p.city,
    'state',          p.state,
    'status',         p.status,
    'created_at',     p.created_at,
    'lucky_number',   ln.number,
    'campaign_title', c.title,
    'campaign_slug',  c.slug,
    'draw_date',      c.draw_date,
    'whatsapp_number', c.whatsapp_number,
    'instagram_url',  c.instagram_url
  ) INTO v_result
  FROM participants p
  LEFT JOIN lucky_numbers ln ON ln.participant_id = p.id AND ln.status = 'active'
  LEFT JOIN campaigns c ON c.id = p.campaign_id
  WHERE p.id = p_participant_id;

  IF v_result IS NULL THEN
    RETURN json_build_object('error', 'Participante não encontrado.', 'code', 'NOT_FOUND');
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_numbers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_partners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- Campaigns: leitura pública (anon pode ver campanhas ativas)
CREATE POLICY "campaigns_anon_select"
  ON campaigns FOR SELECT TO anon USING (true);

-- Partners: leitura pública
CREATE POLICY "partners_anon_select"
  ON partners FOR SELECT TO anon USING (true);

CREATE POLICY "campaign_partners_anon_select"
  ON campaign_partners FOR SELECT TO anon USING (true);

-- Draw results: leitura pública (resultado do sorteio)
CREATE POLICY "draw_results_anon_select"
  ON draw_results FOR SELECT TO anon USING (true);

-- Participants: SEM acesso direto para anon
-- Leitura e escrita apenas via RPC (SECURITY DEFINER)
-- TODO (admin): adicionar policy para authenticated com role='admin' futuramente

-- Lucky numbers: SEM acesso direto para anon
-- Dados retornados apenas via get_participant_confirmation RPC

-- whatsapp_logs, referrals, audit_logs: sem nenhuma policy pública

-- ============================================================
-- Dados iniciais: campanha santa-rita-jacutinga
-- ============================================================

INSERT INTO campaigns (
  slug, title, subtitle, status,
  draw_date, trip_date,
  whatsapp_number, instagram_url, official_post_url
) VALUES (
  'santa-rita-jacutinga',
  'Ganhe uma viagem para Minas Gerais com tudo incluído',
  'Concorra a um final de semana inesquecível em Santa Rita de Jacutinga – MG, com a Amo Viajar.',
  'active',
  '2026-07-15T12:00:00-03:00',
  '2026-07-17T00:00:00-03:00',
  '+5521970563795',
  'https://www.instagram.com/parceriapremiadarj',
  'https://www.instagram.com/parceriapremiadarj'
);
