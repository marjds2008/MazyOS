-- ============================================================
-- Parceria Premiada — BackOffice Operacional MVP
-- Sprint 9: RPCs de leitura para o painel administrativo
-- Migration: 006
-- ============================================================
--
-- TODO SECURITY: proteger BackOffice com autenticação e permissões
-- antes do deploy definitivo. Estas RPCs usam SECURITY DEFINER
-- e estão acessíveis via anon key — adicionar verificação de role
-- ou mover para service_role antes de ir a produção.
--
-- RPCs criadas:
--   admin_dashboard_overview        — 8 métricas para o dashboard
--   admin_list_participants         — lista paginada de participantes
--   admin_list_automation_queue     — lista da fila de automação
--   admin_list_whatsapp_logs        — lista de logs de WhatsApp
--   admin_list_partners             — lista de parceiros por campanha
--   admin_retry_event               — reprocessa evento failed
-- ============================================================

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_dashboard_overview
-- Retorna 8 métricas para os cards do dashboard
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_dashboard_overview()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'total_participants',     (SELECT COUNT(*)::INT FROM participants),
    'numbers_issued',         (SELECT COUNT(*)::INT FROM lucky_numbers WHERE status = 'active'),
    'participants_pending',   (SELECT COUNT(*)::INT FROM participants WHERE status = 'pending'),
    'participants_validated', (SELECT COUNT(*)::INT FROM participants WHERE status = 'validated'),
    'queue_pending',          (SELECT COUNT(*)::INT FROM automation_queue WHERE status = 'pending'),
    'queue_failed',           (SELECT COUNT(*)::INT FROM automation_queue WHERE status = 'failed'),
    'whatsapp_sent',          (SELECT COUNT(*)::INT FROM whatsapp_logs WHERE status = 'sent'),
    'whatsapp_failed',        (SELECT COUNT(*)::INT FROM whatsapp_logs WHERE status = 'failed')
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_list_participants
-- Lista participantes com número da sorte e campanha — paginado
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_list_participants(
  p_campaign_id UUID    DEFAULT NULL,
  p_search      TEXT    DEFAULT NULL,
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE(
  id             UUID,
  name           TEXT,
  whatsapp       TEXT,
  instagram      TEXT,
  city           TEXT,
  state          TEXT,
  status         TEXT,
  lucky_number   INTEGER,
  campaign_id    UUID,
  campaign_slug  TEXT,
  campaign_title TEXT,
  created_at     TIMESTAMPTZ,
  total_count    BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.whatsapp,
    p.instagram,
    p.city,
    p.state,
    p.status,
    ln.number        AS lucky_number,
    p.campaign_id,
    c.slug           AS campaign_slug,
    c.title          AS campaign_title,
    p.created_at,
    COUNT(*) OVER()  AS total_count
  FROM participants p
  LEFT JOIN lucky_numbers ln
    ON ln.participant_id = p.id AND ln.status = 'active'
  LEFT JOIN campaigns c
    ON c.id = p.campaign_id
  WHERE
    (p_campaign_id IS NULL OR p.campaign_id = p_campaign_id)
    AND (
      p_search IS NULL
      OR p.name      ILIKE '%' || p_search || '%'
      OR p.whatsapp  ILIKE '%' || p_search || '%'
      OR p.instagram ILIKE '%' || p_search || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_list_automation_queue
-- Lista eventos da fila com filtros por status e campanha — paginado
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_list_automation_queue(
  p_status      TEXT    DEFAULT NULL,
  p_campaign_id UUID    DEFAULT NULL,
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE(
  queue_id      UUID,
  event_type    TEXT,
  entity_type   TEXT,
  entity_id     UUID,
  campaign_id   UUID,
  campaign_slug TEXT,
  status        TEXT,
  retry_count   INTEGER,
  error_message TEXT,
  created_at    TIMESTAMPTZ,
  processed_at  TIMESTAMPTZ,
  total_count   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id           AS queue_id,
    q.event_type,
    q.entity_type,
    q.entity_id,
    q.campaign_id,
    c.slug         AS campaign_slug,
    q.status,
    q.retry_count,
    q.error_message,
    q.created_at,
    q.processed_at,
    COUNT(*) OVER() AS total_count
  FROM automation_queue q
  LEFT JOIN campaigns c ON c.id = q.campaign_id
  WHERE
    (p_status IS NULL OR q.status = p_status)
    AND (p_campaign_id IS NULL OR q.campaign_id = p_campaign_id)
  ORDER BY q.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_list_whatsapp_logs
-- Lista logs de WhatsApp com filtros por status, campanha e tipo — paginado
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_list_whatsapp_logs(
  p_status      TEXT    DEFAULT NULL,
  p_campaign_id UUID    DEFAULT NULL,
  p_type        TEXT    DEFAULT NULL,
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE(
  id               UUID,
  participant_id   UUID,
  participant_name TEXT,
  campaign_id      UUID,
  campaign_title   TEXT,
  type             TEXT,
  phone            TEXT,
  status           TEXT,
  evolution_msg_id TEXT,
  created_at       TIMESTAMPTZ,
  total_count      BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wl.id,
    wl.participant_id,
    p.name           AS participant_name,
    wl.campaign_id,
    c.title          AS campaign_title,
    wl.type,
    wl.phone,
    wl.status,
    wl.evolution_msg_id,
    wl.created_at,
    COUNT(*) OVER()  AS total_count
  FROM whatsapp_logs wl
  LEFT JOIN participants p ON p.id = wl.participant_id
  LEFT JOIN campaigns c    ON c.id = wl.campaign_id
  WHERE
    (p_status IS NULL OR wl.status = p_status)
    AND (p_campaign_id IS NULL OR wl.campaign_id = p_campaign_id)
    AND (p_type IS NULL OR wl.type = p_type)
  ORDER BY wl.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_list_partners
-- Lista parceiros — filtrável por campanha
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_list_partners(
  p_campaign_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id        UUID,
  name      TEXT,
  instagram TEXT,
  website   TEXT,
  category  TEXT,
  status    TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_campaign_id IS NOT NULL THEN
    RETURN QUERY
    SELECT pt.id, pt.name, pt.instagram, pt.website, pt.category, pt.status
    FROM partners pt
    INNER JOIN campaign_partners cp ON cp.partner_id = pt.id
    WHERE cp.campaign_id = p_campaign_id
    ORDER BY pt.name;
  ELSE
    RETURN QUERY
    SELECT pt.id, pt.name, pt.instagram, pt.website, pt.category, pt.status
    FROM partners pt
    ORDER BY pt.name;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_retry_event
-- Reseta evento 'failed' ou 'cancelled' para 'pending' (retry manual)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_retry_event(p_queue_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM automation_queue
  WHERE id = p_queue_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Evento não encontrado.', 'code', 'NOT_FOUND');
  END IF;

  IF v_status NOT IN ('failed', 'cancelled') THEN
    RETURN json_build_object(
      'error', 'Apenas eventos failed ou cancelled podem ser reprocessados.',
      'code',  'INVALID_STATUS'
    );
  END IF;

  UPDATE automation_queue SET
    status        = 'pending',
    error_message = NULL,
    processed_at  = NULL,
    updated_at    = NOW()
  WHERE id = p_queue_id;

  RETURN json_build_object('success', true, 'queue_id', p_queue_id);
END;
$$;

-- ── Recarregar schema do PostgREST ───────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
