-- ============================================================
-- Parceria Premiada — Fila de Automação Desacoplada
-- Sprint 6: Queue de eventos para n8n, Evolution, CRM, Email
-- Migration: 004
-- ============================================================
--
-- Arquitetura:
--   Landing → RPC (cria participante + número) → trigger enfileira evento
--   → automation_queue → n8n consome → Evolution/CRM/Email
--
-- A Landing NÃO espera nenhuma automação. O fluxo é assíncrono.
-- ============================================================

-- ────────────────────────────────────────────────────────────────────────────
-- TABELA: automation_queue
-- Fila de eventos desacoplada. Cada linha representa um evento que precisa
-- ser processado por um consumidor externo (n8n, worker, webhook).
--
-- HOOK N8N:      consumir eventos pending via GET /api/automation/pending
-- HOOK Evolution: processar event_type='participant.created' para envio WhatsApp
-- HOOK CRM:       processar event_type='participant.validated' para atualizar contato
-- HOOK EMAIL:     processar event_type='participant.created' para envio de boas-vindas
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS automation_queue (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type    TEXT        NOT NULL,  -- participant.created | participant.validated | participant.winner | task.completed
  entity_type   TEXT        NOT NULL,  -- participant | campaign | task
  entity_id     UUID        NOT NULL,
  campaign_id   UUID        REFERENCES campaigns(id) ON DELETE SET NULL,
  payload       JSONB       NOT NULL DEFAULT '{}',
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'done', 'failed', 'cancelled')),
  retry_count   INTEGER     NOT NULL DEFAULT 0,
  error_message TEXT,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE automation_queue ENABLE ROW LEVEL SECURITY;
-- Sem policy anon: payload contém dados sensíveis (whatsapp, instagram)
-- Acesso apenas via RPCs SECURITY DEFINER ou service_role

DROP TRIGGER IF EXISTS automation_queue_updated_at ON automation_queue;
CREATE TRIGGER automation_queue_updated_at
  BEFORE UPDATE ON automation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_automation_queue_status
  ON automation_queue (status) WHERE status IN ('pending', 'processing', 'failed');

CREATE INDEX IF NOT EXISTS idx_automation_queue_event_type
  ON automation_queue (event_type);

CREATE INDEX IF NOT EXISTS idx_automation_queue_created_at
  ON automation_queue (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_queue_campaign
  ON automation_queue (campaign_id, status);

-- ────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Enfileirar evento ao criar lucky_number
--
-- Dispara AFTER INSERT em lucky_numbers, pois neste momento já temos:
-- participant_id, campaign_id, lucky_number E os dados do participante.
-- Evita tocar na RPC create_participant_with_number (Sprint 3 intocada).
--
-- HOOK N8N: Este trigger é o ponto de entrada de todos os eventos de cadastro.
-- HOOK Evolution: payload.whatsapp é o destino da mensagem de boas-vindas.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_enqueue_participant_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant participants%ROWTYPE;
BEGIN
  SELECT * INTO v_participant FROM participants WHERE id = NEW.participant_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  INSERT INTO automation_queue (
    event_type, entity_type, entity_id, campaign_id, payload
  ) VALUES (
    'participant.created',
    'participant',
    v_participant.id,
    v_participant.campaign_id,
    jsonb_build_object(
      'participant_id', v_participant.id,
      'campaign_id',    v_participant.campaign_id,
      'lucky_number',   NEW.number,
      'name',           v_participant.name,
      'whatsapp',       v_participant.whatsapp,
      'instagram',      v_participant.instagram,
      'city',           v_participant.city,
      'state',          v_participant.state,
      'created_at',     v_participant.created_at
      -- HOOK N8N: adicionar campos extras conforme o fluxo precisar
      -- HOOK CRM: adicionar score, tags ou segmentação aqui
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_participant_created ON lucky_numbers;
CREATE TRIGGER trg_enqueue_participant_created
  AFTER INSERT ON lucky_numbers
  FOR EACH ROW EXECUTE FUNCTION fn_enqueue_participant_created();

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_get_queue_stats
-- Retorna contagem de eventos por status (para o card do painel admin).
-- Filtrável por campanha; sem filtro retorna totais globais.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_get_queue_stats(p_campaign_slug TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  IF p_campaign_slug IS NOT NULL THEN
    SELECT id INTO v_campaign_id FROM campaigns WHERE slug = p_campaign_slug;
  END IF;

  RETURN json_build_object(
    'pending', (
      SELECT COUNT(*) FROM automation_queue
      WHERE status = 'pending'
        AND (v_campaign_id IS NULL OR campaign_id = v_campaign_id)
    ),
    'processing', (
      SELECT COUNT(*) FROM automation_queue
      WHERE status = 'processing'
        AND (v_campaign_id IS NULL OR campaign_id = v_campaign_id)
    ),
    'done', (
      SELECT COUNT(*) FROM automation_queue
      WHERE status = 'done'
        AND (v_campaign_id IS NULL OR campaign_id = v_campaign_id)
    ),
    'failed', (
      SELECT COUNT(*) FROM automation_queue
      WHERE status = 'failed'
        AND (v_campaign_id IS NULL OR campaign_id = v_campaign_id)
    ),
    'total', (
      SELECT COUNT(*) FROM automation_queue
      WHERE (v_campaign_id IS NULL OR campaign_id = v_campaign_id)
    )
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: get_pending_events
-- Retorna até p_limit eventos com status='pending', ordenados por criação.
-- Consumido pelo endpoint GET /api/automation/pending → n8n.
--
-- HOOK N8N: este é o endpoint de polling do n8n para buscar novos eventos.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_pending_events(p_limit INTEGER DEFAULT 100)
RETURNS TABLE(
  queue_id      UUID,
  event_type    TEXT,
  entity_type   TEXT,
  entity_id     UUID,
  campaign_id   UUID,
  payload       JSONB,
  retry_count   INTEGER,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.event_type,
    q.entity_type,
    q.entity_id,
    q.campaign_id,
    q.payload,
    q.retry_count,
    q.created_at
  FROM automation_queue q
  WHERE q.status = 'pending'
  ORDER BY q.created_at ASC
  LIMIT p_limit;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: update_queue_status
-- Atualiza o status de um evento na fila.
-- Consumido pelo endpoint POST /api/automation/update → n8n.
--
-- HOOK N8N: chamar após processar cada evento para marcar como done/failed.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_queue_status(
  p_queue_id     UUID,
  p_status       TEXT,
  p_error        TEXT    DEFAULT NULL,
  p_processed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_retry INTEGER;
BEGIN
  SELECT status, retry_count
  INTO v_current_status, v_retry
  FROM automation_queue WHERE id = p_queue_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Evento não encontrado.', 'code', 'NOT_FOUND');
  END IF;

  IF p_status NOT IN ('pending', 'processing', 'done', 'failed', 'cancelled') THEN
    RETURN json_build_object('error', 'Status inválido.', 'code', 'INVALID_STATUS');
  END IF;

  UPDATE automation_queue SET
    status        = p_status,
    error_message = CASE WHEN p_status = 'failed' THEN p_error ELSE error_message END,
    processed_at  = CASE WHEN p_status IN ('done', 'failed') THEN p_processed_at ELSE processed_at END,
    retry_count   = CASE WHEN p_status = 'failed' THEN v_retry + 1 ELSE v_retry END,
    updated_at    = NOW()
  WHERE id = p_queue_id;

  RETURN json_build_object('success', true, 'queue_id', p_queue_id, 'status', p_status);
END;
$$;

-- ── Recarregar schema do PostgREST ───────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

-- ────────────────────────────────────────────────────────────────────────────
-- BACKFILL: Enfileirar participantes existentes
-- Usa status 'pending' para que o n8n possa processar quando for ativado.
-- Marcar como 'done' manualmente se não quiser reprocessar participantes antigos.
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO automation_queue (event_type, entity_type, entity_id, campaign_id, payload, status)
SELECT
  'participant.created',
  'participant',
  p.id,
  p.campaign_id,
  jsonb_build_object(
    'participant_id', p.id,
    'campaign_id',    p.campaign_id,
    'lucky_number',   ln.number,
    'name',           p.name,
    'whatsapp',       p.whatsapp,
    'instagram',      p.instagram,
    'city',           p.city,
    'state',          p.state,
    'created_at',     p.created_at,
    'backfill',       true
  ),
  'pending'
FROM participants p
LEFT JOIN lucky_numbers ln ON ln.participant_id = p.id AND ln.status = 'active'
ON CONFLICT DO NOTHING;
