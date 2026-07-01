-- ============================================================
-- Parceria Premiada — whatsapp_logs: tipo, phone e RPC de log
-- Sprint 8: Integração n8n → Evolution API
-- Migration: 005
-- ============================================================
--
-- whatsapp_logs já existe (migration 001).
-- Esta migration adiciona colunas para suportar:
--   - type:             tipo do evento que originou o envio
--   - phone:            número formatado enviado para a Evolution
--   - evolution_msg_id: ID retornado pela Evolution API
-- ============================================================

-- ── Adicionar coluna type ─────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_logs' AND column_name = 'type'
  ) THEN
    ALTER TABLE whatsapp_logs
      ADD COLUMN type TEXT NOT NULL DEFAULT 'participant.created';
  END IF;
END $$;

-- ── Adicionar coluna phone ────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_logs' AND column_name = 'phone'
  ) THEN
    ALTER TABLE whatsapp_logs ADD COLUMN phone TEXT;
  END IF;
END $$;

-- ── Adicionar coluna evolution_msg_id ────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_logs' AND column_name = 'evolution_msg_id'
  ) THEN
    ALTER TABLE whatsapp_logs ADD COLUMN evolution_msg_id TEXT;
  END IF;
END $$;

-- ── Índice de idempotência ────────────────────────────────────────────────────
-- Usado pelo RPC check_whatsapp_sent para verificar envios anteriores

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_idempotency
  ON whatsapp_logs (participant_id, campaign_id, type, status)
  WHERE status = 'sent';

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: check_whatsapp_sent
-- Verifica se já existe um envio bem-sucedido para este participante/tipo.
-- Chamada pelo n8n antes de enviar para garantir idempotência.
-- Retorna JSON { already_sent: bool } — mais fácil de parsear no n8n.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_whatsapp_sent(
  p_participant_id UUID,
  p_campaign_id    UUID,
  p_type           TEXT DEFAULT 'participant.created'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'already_sent',
    EXISTS (
      SELECT 1 FROM whatsapp_logs
      WHERE participant_id = p_participant_id
        AND campaign_id    = p_campaign_id
        AND type           = p_type
        AND status         = 'sent'
    )
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: log_whatsapp_message
-- Insere um registro em whatsapp_logs após tentativa de envio.
-- Chamada pelo n8n após envio via Evolution API (sucesso ou falha).
-- Retorna o UUID do registro criado.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_whatsapp_message(
  p_participant_id   UUID,
  p_campaign_id      UUID,
  p_phone            TEXT,
  p_message          TEXT,
  p_status           TEXT DEFAULT 'sent',
  p_type             TEXT DEFAULT 'participant.created',
  p_evolution_msg_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id     UUID;
  v_status TEXT;
BEGIN
  -- Validar status
  v_status := p_status;
  IF v_status NOT IN ('pending', 'sent', 'delivered', 'failed', 'read') THEN
    v_status := 'sent';
  END IF;

  INSERT INTO whatsapp_logs (
    participant_id, campaign_id, phone, message,
    status, type, evolution_msg_id
  ) VALUES (
    p_participant_id, p_campaign_id, p_phone, p_message,
    v_status, p_type, p_evolution_msg_id
  )
  RETURNING id INTO v_id;

  RETURN json_build_object('log_id', v_id, 'status', v_status);
END;
$$;

-- ── Recarregar schema ─────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
