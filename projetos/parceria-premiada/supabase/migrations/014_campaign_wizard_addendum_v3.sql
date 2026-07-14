-- ============================================================
-- Migration 014 — Campaign Wizard Addendum v3
-- Seções 36, 36-A, 37, 39, 41, 42, 43, 44, 45
-- ============================================================
-- ANTES DE APLICAR: gerar backup via Supabase Dashboard
-- (Database > Backups) ou executar manualmente:
--
--   CREATE TABLE _bkp_campaigns_014    AS SELECT * FROM campaigns;
--   CREATE TABLE _bkp_participants_014 AS SELECT * FROM participants;
--   CREATE TABLE _bkp_lucky_numbers_014 AS SELECT * FROM lucky_numbers;
--   CREATE TABLE _bkp_pp_campanhas_014 AS SELECT * FROM pp_campanhas;
-- ============================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 36-A — Novo status 'cancelada' / 'cancelled'
-- ═══════════════════════════════════════════════════════════════

-- campaigns (inglês)
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('upcoming','active','ended','cancelled'));

-- pp_campanhas (português)
ALTER TABLE pp_campanhas DROP CONSTRAINT IF EXISTS pp_campanhas_status_check;
ALTER TABLE pp_campanhas ADD CONSTRAINT pp_campanhas_status_check
  CHECK (status IN ('rascunho','ativa','pausada','encerrada','cancelada'));

-- ─── Campos de cancelamento ────────────────────────────────────

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by        TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

ALTER TABLE pp_campanhas
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by        TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 42 — Mensagem pública de cancelamento
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS cancellation_public_message         TEXT,
  ADD COLUMN IF NOT EXISTS show_cancellation_reason_publicly   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS refund_or_compensation_instructions TEXT;

ALTER TABLE pp_campanhas
  ADD COLUMN IF NOT EXISTS cancellation_public_message         TEXT,
  ADD COLUMN IF NOT EXISTS show_cancellation_reason_publicly   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS refund_or_compensation_instructions TEXT;

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 43 — Controle de concorrência otimista
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE pp_campanhas
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 44 — Versionamento de templates de landing
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS landing_templates (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  version    INTEGER     NOT NULL DEFAULT 1,
  status     TEXT        NOT NULL DEFAULT 'draft'
             CHECK (status IN ('draft','published','deprecated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, version)
);

INSERT INTO landing_templates (name, version, status)
VALUES ('turismo', 1, 'published')
ON CONFLICT (name, version) DO NOTHING;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS template_id      UUID REFERENCES landing_templates(id),
  ADD COLUMN IF NOT EXISTS template_version INTEGER;

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 41 — View pública (substitui SELECT direto em campaigns)
-- ═══════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public_campaigns_view;
CREATE VIEW public_campaigns_view AS
SELECT
  c.id,
  c.slug,
  c.title,
  c.subtitle,
  c.status,
  c.hero_image,
  c.start_date,
  c.end_date,
  c.draw_date,
  c.trip_date,
  c.main_color,
  c.accent_color,
  c.participant_count,
  c.instagram_url,
  c.official_post_url,
  c.template_id,
  c.template_version,
  -- campos de cancelamento expostos publicamente
  c.cancellation_public_message,
  c.show_cancellation_reason_publicly,
  CASE WHEN c.show_cancellation_reason_publicly
    THEN c.cancellation_reason
    ELSE NULL
  END AS cancellation_reason_public
FROM campaigns c
WHERE c.status IN ('upcoming','active','ended','cancelled');

GRANT SELECT ON public_campaigns_view TO anon, authenticated;

-- Remover policy de SELECT direto em campaigns (substituída pela view)
DROP POLICY IF EXISTS campaigns_anon_select ON campaigns;

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 36 — Cancelar campanha Santa Rita de Jacutinga
-- ═══════════════════════════════════════════════════════════════

UPDATE campaigns SET
  status                             = 'cancelled',
  cancelled_at                       = NOW(),
  cancelled_by                       = 'admin:marcio',
  cancellation_reason                = 'Sorteio cancelado. A excursão comercial para Santa Rita de Jacutinga segue normalmente pela Amo Viajar.',
  cancellation_public_message        = 'Este sorteio foi encerrado e não está mais recebendo participações. Os registros anteriores foram preservados para fins de transparência.',
  show_cancellation_reason_publicly  = FALSE,
  template_id                        = (SELECT id FROM landing_templates WHERE name='turismo' AND version=1),
  template_version                   = 1
WHERE slug = 'santa-rita-jacutinga';

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 45 — Snapshot imutável da campanha Jacutinga
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS campaign_snapshots (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  snapshot_data JSONB       NOT NULL,
  reason        TEXT        NOT NULL DEFAULT 'publicação inicial',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaign_snapshots ENABLE ROW LEVEL SECURITY;

-- Snapshots são imutáveis: só INSERT é permitido (autenticado)
CREATE POLICY snapshots_insert_authenticated ON campaign_snapshots
  FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY snapshots_select_authenticated ON campaign_snapshots
  FOR SELECT TO authenticated USING (TRUE);

-- Gerar snapshot do estado final de Jacutinga
INSERT INTO campaign_snapshots (campaign_id, snapshot_data, reason)
SELECT
  id,
  row_to_json(c)::jsonb,
  'snapshot-legado: cancelamento da campanha Santa Rita de Jacutinga'
FROM campaigns c
WHERE slug = 'santa-rita-jacutinga';

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 37 — Transição automática de status (pg_cron)
-- ═══════════════════════════════════════════════════════════════

-- Datas de início/fim em pp_campanhas (Campaign Wizard vai usá-las)
ALTER TABLE pp_campanhas
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone  TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- Log de transições automáticas
CREATE TABLE IF NOT EXISTS campaign_transition_logs (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name   TEXT        NOT NULL,
  campaign_id  UUID        NOT NULL,
  from_status  TEXT        NOT NULL,
  to_status    TEXT        NOT NULL,
  triggered_by TEXT        NOT NULL DEFAULT 'system',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaign_transition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY transition_logs_admin_read ON campaign_transition_logs
  FOR SELECT TO authenticated USING (TRUE);

-- Função idempotente de transição
CREATE OR REPLACE FUNCTION auto_transition_campaign_status()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r RECORD;
BEGIN
  -- rascunho → ativa (quando starts_at chegou)
  FOR r IN
    SELECT id, status FROM pp_campanhas
    WHERE status = 'rascunho'
      AND starts_at IS NOT NULL
      AND starts_at <= NOW()
      AND cancelled_at IS NULL
  LOOP
    UPDATE pp_campanhas SET status = 'ativa', updated_at = NOW() WHERE id = r.id;
    INSERT INTO campaign_transition_logs (table_name, campaign_id, from_status, to_status)
      VALUES ('pp_campanhas', r.id, r.status, 'ativa');
  END LOOP;

  -- ativa → encerrada (quando ends_at chegou)
  FOR r IN
    SELECT id, status FROM pp_campanhas
    WHERE status = 'ativa'
      AND ends_at IS NOT NULL
      AND ends_at <= NOW()
      AND cancelled_at IS NULL
  LOOP
    UPDATE pp_campanhas SET status = 'encerrada', updated_at = NOW() WHERE id = r.id;
    INSERT INTO campaign_transition_logs (table_name, campaign_id, from_status, to_status)
      VALUES ('pp_campanhas', r.id, r.status, 'encerrada');
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION auto_transition_campaign_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auto_transition_campaign_status() TO authenticated;

-- Agendar pg_cron (requer extensão pg_cron habilitada no Supabase)
-- Ativar em: Dashboard > Database > Extensions > pg_cron
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('auto-transition-campaign-status');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'auto-transition-campaign-status',
      '*/5 * * * *',
      'SELECT auto_transition_campaign_status()'
    );
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- SEÇÃO 39 — Tipo de verificação de missões
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE campaign_tasks
  ADD COLUMN IF NOT EXISTS verification_type TEXT NOT NULL DEFAULT 'manual'
  CHECK (verification_type IN ('manual','automatic'));

-- DROP primeiro (libera o constraint antigo)
ALTER TABLE participant_actions
  DROP CONSTRAINT IF EXISTS participant_actions_status_check;

-- UPDATE sem constraint ativo (pode setar self_declared livremente)
UPDATE participant_actions SET status = 'self_declared' WHERE status = 'completed';

-- ADD com todas as linhas já válidas
ALTER TABLE participant_actions
  ADD CONSTRAINT participant_actions_status_check
  CHECK (status IN ('pending','self_declared','verified','rejected'));

COMMIT;
