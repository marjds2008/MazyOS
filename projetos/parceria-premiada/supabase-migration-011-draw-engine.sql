-- ============================================================
-- Migration 011 — Draw Engine v2.0
-- Adiciona suporte ao motor de geração de números da sorte
-- Criptograficamente determinístico, sem colisões, sem Math.random()
-- ============================================================

-- ── Colunas na tabela de campanhas ───────────────────────────

ALTER TABLE pp_campanhas
  ADD COLUMN IF NOT EXISTS seed               TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS seed_hash          TEXT,
  ADD COLUMN IF NOT EXISTS algorithm_version  TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS draw_engine_version TEXT DEFAULT '2.0',
  ADD COLUMN IF NOT EXISTS current_sequence   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_draw_at    TIMESTAMPTZ;

COMMENT ON COLUMN pp_campanhas.seed
  IS 'Seed criptográfica da campanha (hex 64 chars). Imutável após primeiro uso.';
COMMENT ON COLUMN pp_campanhas.seed_hash
  IS 'SHA256(seed) — hash público para auditoria sem expor a seed.';
COMMENT ON COLUMN pp_campanhas.current_sequence
  IS 'Contador atômico de participantes. Incrementado com UPDATE ... RETURNING.';

-- ── Colunas na tabela de participantes ───────────────────────

ALTER TABLE pp_participantes
  ADD COLUMN IF NOT EXISTS sequence_number      INTEGER,
  ADD COLUMN IF NOT EXISTS display_number       INTEGER,
  ADD COLUMN IF NOT EXISTS display_number_fmt   TEXT,
  ADD COLUMN IF NOT EXISTS display_hash         TEXT,
  ADD COLUMN IF NOT EXISTS created_by_algorithm BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN pp_participantes.sequence_number
  IS 'Número de sequência do participante dentro da campanha (1-indexed). Único por campanha.';
COMMENT ON COLUMN pp_participantes.display_number
  IS 'Número da sorte 0-99999 gerado pelo Draw Engine.';
COMMENT ON COLUMN pp_participantes.display_number_fmt
  IS 'Número formatado com zeros à esquerda (ex: 00042).';
COMMENT ON COLUMN pp_participantes.display_hash
  IS 'SHA256(seed:sequence:display_number) — prova criptográfica para auditoria.';

-- Índice para busca por número da sorte (ex: encontrar ganhador)
CREATE INDEX IF NOT EXISTS idx_pp_participantes_display_number
  ON pp_participantes(display_number, campanha_id);

-- Índice para garantia de sequência única por campanha
CREATE UNIQUE INDEX IF NOT EXISTS idx_pp_participantes_campanha_sequence
  ON pp_participantes(campanha_id, sequence_number)
  WHERE sequence_number IS NOT NULL;

-- ── Tabela de auditoria do Draw Engine ───────────────────────

CREATE TABLE IF NOT EXISTS pp_draw_audit (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id      UUID NOT NULL REFERENCES pp_campanhas(id) ON DELETE CASCADE,
  participante_id  UUID REFERENCES pp_participantes(id) ON DELETE SET NULL,
  sequence_number  INTEGER NOT NULL,
  display_number   INTEGER NOT NULL,
  display_hash     TEXT NOT NULL,
  algorithm_version TEXT NOT NULL DEFAULT 'v1',
  draw_engine_version TEXT NOT NULL DEFAULT '2.0',
  verified_at      TIMESTAMPTZ,
  verified_ok      BOOLEAN,
  ip_address       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_draw_audit_campanha
  ON pp_draw_audit(campanha_id, created_at DESC);

-- ── RPC: next sequence number (atômico) ──────────────────────

CREATE OR REPLACE FUNCTION get_next_sequence(p_campanha_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  PERFORM _pp_check_admin();

  UPDATE pp_campanhas
  SET current_sequence = current_sequence + 1
  WHERE id = p_campanha_id
  RETURNING current_sequence INTO v_seq;

  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'Campanha não encontrada: %', p_campanha_id;
  END IF;

  RETURN v_seq;
END;
$$;

-- ── RPC: salvar número do participante ───────────────────────

CREATE OR REPLACE FUNCTION save_participant_number(
  p_participante_id UUID,
  p_campanha_id     UUID,
  p_sequence        INTEGER,
  p_display_number  INTEGER,
  p_display_fmt     TEXT,
  p_display_hash    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM _pp_check_admin();

  UPDATE pp_participantes
  SET
    sequence_number      = p_sequence,
    display_number       = p_display_number,
    display_number_fmt   = p_display_fmt,
    display_hash         = p_display_hash,
    created_by_algorithm = TRUE
  WHERE id = p_participante_id AND campanha_id = p_campanha_id;

  -- Registrar auditoria
  INSERT INTO pp_draw_audit (
    campanha_id, participante_id, sequence_number,
    display_number, display_hash, algorithm_version, draw_engine_version
  ) VALUES (
    p_campanha_id, p_participante_id, p_sequence,
    p_display_number, p_display_hash, 'v1', '2.0'
  );
END;
$$;

-- ── RPC: verificar número (público — sem autenticação) ───────

CREATE OR REPLACE FUNCTION verify_participant_number(
  p_campanha_id    UUID,
  p_sequence       INTEGER,
  p_display_number INTEGER
)
RETURNS TABLE (
  valid            BOOLEAN,
  display_hash     TEXT,
  algorithm_version TEXT,
  campanha_nome    TEXT,
  participante_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (pp.display_number = p_display_number AND pp.sequence_number = p_sequence) AS valid,
    pp.display_hash,
    'v1'::TEXT AS algorithm_version,
    pc.nome AS campanha_nome,
    pp.nome AS participante_nome
  FROM pp_participantes pp
  JOIN pp_campanhas pc ON pc.id = pp.campanha_id
  WHERE
    pp.campanha_id    = p_campanha_id
    AND pp.sequence_number = p_sequence
  LIMIT 1;
END;
$$;

-- ── RPC: audit info de uma campanha ──────────────────────────

CREATE OR REPLACE FUNCTION get_draw_audit_info(p_campanha_id UUID)
RETURNS TABLE (
  seed_hash           TEXT,
  algorithm_version   TEXT,
  draw_engine_version TEXT,
  total_issued        BIGINT,
  first_number        INTEGER,
  last_number         INTEGER,
  created_draw_at     TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM _pp_check_admin();

  RETURN QUERY
  SELECT
    pc.seed_hash,
    pc.algorithm_version,
    pc.draw_engine_version,
    COUNT(pp.id) AS total_issued,
    MIN(pp.display_number) AS first_number,
    MAX(pp.display_number) AS last_number,
    pc.created_draw_at
  FROM pp_campanhas pc
  LEFT JOIN pp_participantes pp
    ON pp.campanha_id = pc.id AND pp.display_number IS NOT NULL
  WHERE pc.id = p_campanha_id
  GROUP BY pc.seed_hash, pc.algorithm_version, pc.draw_engine_version, pc.created_draw_at;
END;
$$;

-- ── RPC: log de auditoria paginado ───────────────────────────

CREATE OR REPLACE FUNCTION list_draw_audit(
  p_campanha_id UUID,
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE (
  id              UUID,
  sequence_number INTEGER,
  display_number  INTEGER,
  display_hash    TEXT,
  verified_ok     BOOLEAN,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ,
  participante_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM _pp_check_admin();

  RETURN QUERY
  SELECT
    da.id,
    da.sequence_number,
    da.display_number,
    da.display_hash,
    da.verified_ok,
    da.verified_at,
    da.created_at,
    pp.nome AS participante_nome
  FROM pp_draw_audit da
  LEFT JOIN pp_participantes pp ON pp.id = da.participante_id
  WHERE da.campanha_id = p_campanha_id
  ORDER BY da.sequence_number ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ── Permissões ───────────────────────────────────────────────

REVOKE ALL ON FUNCTION get_next_sequence(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION save_participant_number(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_draw_audit_info(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION list_draw_audit(UUID, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_next_sequence(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_participant_number(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_draw_audit_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION list_draw_audit(UUID, INTEGER, INTEGER) TO authenticated;

-- verify_participant_number é pública
GRANT EXECUTE ON FUNCTION verify_participant_number(UUID, INTEGER, INTEGER) TO anon, authenticated;

REVOKE ALL ON TABLE pp_draw_audit FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON TABLE pp_draw_audit TO authenticated;

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
