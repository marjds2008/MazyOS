-- ============================================================
-- Parceria Premiada — Admin Read Views
-- Sprint 4: Painel Administrativo
-- Migration: 002
-- ============================================================
--
-- TODO SECURITY: As RPCs abaixo estão acessíveis via anon key.
-- Antes do deploy público, adicionar verificação de role ou
-- remover o acesso anon e criar uma service_role key dedicada.
-- ============================================================

-- ── RPC: admin_get_campaign_stats ────────────────────────────────────────────
-- Retorna totais agregados de uma campanha para os cards do dashboard

CREATE OR REPLACE FUNCTION admin_get_campaign_stats(p_campaign_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  SELECT id INTO v_campaign_id FROM campaigns WHERE slug = p_campaign_slug;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Campanha não encontrada.', 'code', 'NOT_FOUND');
  END IF;

  RETURN json_build_object(
    'total_participants', (
      SELECT COUNT(*) FROM participants
      WHERE campaign_id = v_campaign_id AND status != 'cancelled'
    ),
    'total_numbers', (
      SELECT COUNT(*) FROM lucky_numbers
      WHERE campaign_id = v_campaign_id AND status = 'active'
    ),
    'pending', (
      SELECT COUNT(*) FROM participants
      WHERE campaign_id = v_campaign_id AND status = 'pending'
    ),
    'validated', (
      SELECT COUNT(*) FROM participants
      WHERE campaign_id = v_campaign_id AND status = 'validated'
    ),
    'winner', (
      SELECT COUNT(*) FROM participants
      WHERE campaign_id = v_campaign_id AND status = 'winner'
    ),
    'cancelled', (
      SELECT COUNT(*) FROM participants
      WHERE campaign_id = v_campaign_id AND status = 'cancelled'
    )
  );
END;
$$;

-- ── RPC: admin_get_participants ───────────────────────────────────────────────
-- Retorna lista completa de participantes para o painel admin
-- Suporta busca por nome, WhatsApp ou Instagram
-- Ordenado por número da sorte crescente

CREATE OR REPLACE FUNCTION admin_get_participants(
  p_campaign_slug TEXT,
  p_search        TEXT DEFAULT ''
)
RETURNS TABLE(
  participant_id     UUID,
  campaign_slug      TEXT,
  participant_name   TEXT,
  whatsapp           TEXT,
  instagram          TEXT,
  city               TEXT,
  state              TEXT,
  participant_status TEXT,
  lucky_number       INTEGER,
  created_at         TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
  v_search      TEXT;
BEGIN
  SELECT id INTO v_campaign_id FROM campaigns WHERE slug = p_campaign_slug;
  IF NOT FOUND THEN RETURN; END IF;

  v_search := lower(trim(p_search));

  RETURN QUERY
  SELECT
    p.id,
    p_campaign_slug,
    p.name,
    p.whatsapp,
    p.instagram,
    p.city,
    p.state,
    p.status,
    ln.number,
    p.created_at
  FROM participants p
  LEFT JOIN lucky_numbers ln
    ON ln.participant_id = p.id AND ln.status != 'cancelled'
  WHERE p.campaign_id = v_campaign_id
    AND (
      v_search = ''
      OR lower(p.name)      LIKE '%' || v_search || '%'
      OR p.whatsapp         LIKE '%' || v_search || '%'
      OR lower(p.instagram) LIKE '%' || v_search || '%'
    )
  ORDER BY ln.number ASC NULLS LAST;
END;
$$;
