-- ============================================================
-- Migration 012 — Integração Draw Engine no fluxo de cadastro
-- ============================================================
-- O que esta migration faz:
--   1. Habilita pgcrypto (HMAC-SHA256 nativo no PostgreSQL)
--   2. Adiciona colunas Draw Engine em campaigns (tabela antiga)
--   3. Adiciona colunas Draw Engine em participants (tabela antiga)
--   4. Implementa algoritmo Feistel em PL/pgSQL
--   5. Atualiza create_participant_with_number → Draw Engine
--   6. Atualiza get_participant_confirmation → retorna display_number
--   7. Atualiza trigger fn_enqueue_participant_created → payload completo
--   8. Atualiza list_pp_participantes → UNION com participants (admin vê tudo)
-- ============================================================

-- ── 1. pgcrypto ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 2. Colunas Draw Engine em campaigns (tabela antiga do site) ───

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS seed               TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS seed_hash          TEXT,
  ADD COLUMN IF NOT EXISTS algorithm_version  TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS draw_engine_version TEXT DEFAULT '2.0';

COMMENT ON COLUMN campaigns.seed      IS 'Seed do Draw Engine (hex 64). Imutável após uso.';
COMMENT ON COLUMN campaigns.seed_hash IS 'SHA256(seed) — hash público para auditoria.';
-- participant_count já existe como contador atômico — será usado como sequence

-- ── 3. Colunas Draw Engine em participants (tabela antiga do site) ─

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS sequence_number      INTEGER,
  ADD COLUMN IF NOT EXISTS display_number       INTEGER,
  ADD COLUMN IF NOT EXISTS display_number_fmt   TEXT,
  ADD COLUMN IF NOT EXISTS display_hash         TEXT,
  ADD COLUMN IF NOT EXISTS created_by_algorithm BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN participants.sequence_number IS 'Sequência usada como input do Draw Engine (= participant_count da campanha).';
COMMENT ON COLUMN participants.display_number  IS 'Número da sorte [0-99999] gerado pelo Draw Engine.';
COMMENT ON COLUMN participants.display_hash    IS 'SHA256(seed:sequence:display_number) — prova criptográfica.';

-- ── 4. Draw Engine em PL/pgSQL ───────────────────────────────

-- Rodada do Feistel: HMAC-SHA256(key, round||value) mod mod_v
CREATE OR REPLACE FUNCTION pp_feistel_round(
  key     BYTEA,
  rnd     INTEGER,
  val     INTEGER,
  mod_v   INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  buf    BYTEA;
  h      BYTEA;
  result BIGINT;
BEGIN
  buf := decode(lpad(to_hex(rnd & 255), 2, '0'), 'hex')
      || decode(lpad(to_hex(val), 8, '0'), 'hex');
  h := hmac(buf, key, 'sha256');
  result := (get_byte(h, 0)::BIGINT << 24)
          | (get_byte(h, 1)::BIGINT << 16)
          | (get_byte(h, 2)::BIGINT << 8)
          |  get_byte(h, 3)::BIGINT;
  RETURN (result % mod_v)::INTEGER;
END;
$$;

-- Gera número da sorte: Feistel não-balanceada (8+9 bits, 8 rodadas) + cycle-walk
-- Propriedade: bijetora → zero colisões para uma mesma seed
CREATE OR REPLACE FUNCTION pp_generate_number(
  p_seed     TEXT,
  p_sequence INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  key   BYTEA;
  x     INTEGER;
  L     INTEGER;
  R     INTEGER;
  f     INTEGER;
BEGIN
  key := digest('draw-engine:v1:' || p_seed, 'sha256');
  x   := (p_sequence - 1) % 131072;

  LOOP
    L := (x >> 9) & 255;
    R := x & 511;

    FOR r IN 0..7 LOOP
      IF r % 2 = 0 THEN
        f := pp_feistel_round(key, r, L, 512);
        R := (R + f) % 512;
      ELSE
        f := pp_feistel_round(key, r, R, 256);
        L := (L + f) % 256;
      END IF;
    END LOOP;

    x := (L << 9) | R;
    EXIT WHEN x < 100000;
  END LOOP;

  RETURN x;
END;
$$;

-- ── 5. Atualizar create_participant_with_number ───────────────

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
  v_campaign       campaigns%ROWTYPE;
  v_participant_id UUID;
  v_sequence       INTEGER;
  v_display_number INTEGER;
  v_display_fmt    TEXT;
  v_display_hash   TEXT;
  v_instagram      TEXT;
  v_whatsapp       TEXT;
BEGIN
  v_instagram := lower(trim(regexp_replace(p_instagram, '^@+', '')));
  v_whatsapp  := regexp_replace(p_whatsapp, '[^0-9]', '', 'g');

  IF NOT p_accepted_lgpd THEN
    RETURN json_build_object('error', 'É necessário aceitar o regulamento para participar.', 'code', 'LGPD_NOT_ACCEPTED');
  END IF;

  IF length(v_whatsapp) < 10 OR length(v_whatsapp) > 11 THEN
    RETURN json_build_object('error', 'WhatsApp inválido. Informe DDD + número.', 'code', 'INVALID_WHATSAPP');
  END IF;

  IF length(v_instagram) < 2 THEN
    RETURN json_build_object('error', 'Instagram inválido.', 'code', 'INVALID_INSTAGRAM');
  END IF;

  -- Bloquear linha da campanha (FOR UPDATE serializa o contador)
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE slug = p_campaign_slug AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Campanha não encontrada ou encerrada.', 'code', 'CAMPAIGN_NOT_FOUND');
  END IF;

  IF v_campaign.seed IS NULL THEN
    RETURN json_build_object(
      'error', 'Campanha sem Draw Engine configurado. Contate o organizador.',
      'code',  'NO_SEED'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM participants WHERE campaign_id = v_campaign.id AND whatsapp = v_whatsapp) THEN
    RETURN json_build_object('error', 'Este WhatsApp já está cadastrado nessa campanha.', 'code', 'DUPLICATE_WHATSAPP');
  END IF;

  IF EXISTS (SELECT 1 FROM participants WHERE campaign_id = v_campaign.id AND instagram = v_instagram) THEN
    RETURN json_build_object('error', 'Este Instagram já está cadastrado nessa campanha.', 'code', 'DUPLICATE_INSTAGRAM');
  END IF;

  -- Inserir participante (sem número ainda)
  INSERT INTO participants (campaign_id, name, email, whatsapp, instagram, city, state, accepted_lgpd)
  VALUES (
    v_campaign.id,
    trim(p_name),
    NULLIF(trim(p_email), ''),
    v_whatsapp,
    v_instagram,
    NULLIF(trim(p_city), ''),
    NULLIF(p_state, ''),
    p_accepted_lgpd
  )
  RETURNING id INTO v_participant_id;

  -- Incremento atômico da sequência (FOR UPDATE já protege contra race condition)
  UPDATE campaigns
  SET participant_count = participant_count + 1
  WHERE id = v_campaign.id
  RETURNING participant_count INTO v_sequence;

  -- Draw Engine: gerar número da sorte
  v_display_number := pp_generate_number(v_campaign.seed, v_sequence);
  v_display_fmt    := lpad(v_display_number::TEXT, 5, '0');
  v_display_hash   := encode(
    digest(v_campaign.seed || ':' || v_sequence::TEXT || ':' || v_display_number::TEXT, 'sha256'),
    'hex'
  );

  -- Salvar número no participante
  UPDATE participants SET
    sequence_number      = v_sequence,
    display_number       = v_display_number,
    display_number_fmt   = v_display_fmt,
    display_hash         = v_display_hash,
    created_by_algorithm = TRUE
  WHERE id = v_participant_id;

  -- Inserir lucky_number (compatibilidade retroativa — trigger dispara automation_queue)
  INSERT INTO lucky_numbers (campaign_id, participant_id, number)
  VALUES (v_campaign.id, v_participant_id, v_sequence);

  -- Audit log
  INSERT INTO audit_logs (table_name, record_id, action, description)
  VALUES (
    'participants',
    v_participant_id,
    'INSERT',
    'Draw Engine v2 · campanha: ' || p_campaign_slug ||
    ' · seq: ' || v_sequence || ' · PP-' || v_display_fmt
  );

  RETURN json_build_object(
    'success',          true,
    'participant_id',   v_participant_id,
    'campaign_id',      v_campaign.id,
    'number',           v_sequence,          -- backward compat
    'sequence_number',  v_sequence,
    'display_number',   v_display_number,
    'display_hash',     v_display_hash,
    'display_fmt',      v_display_fmt
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'Cadastro duplicado detectado.', 'code', 'DUPLICATE_ERROR');
  WHEN OTHERS THEN
    RAISE WARNING 'create_participant_with_number error: % %', SQLERRM, SQLSTATE;
    RETURN json_build_object('error', 'Erro interno. Tente novamente em instantes.', 'code', 'INTERNAL_ERROR');
END;
$$;

-- ── 6. Atualizar get_participant_confirmation ─────────────────

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
    'name',               p.name,
    'city',               p.city,
    'state',              p.state,
    'status',             p.status,
    'created_at',         p.created_at,
    -- Draw Engine (novo) — preferir estes
    'sequence_number',    p.sequence_number,
    'display_number',     p.display_number,
    'display_number_fmt', p.display_number_fmt,
    'display_hash',       p.display_hash,
    -- Lucky number antigo (fallback)
    'lucky_number',       COALESCE(p.display_number, ln.number),
    -- Campanha
    'campaign_title',     c.title,
    'campaign_slug',      c.slug,
    'draw_date',          c.draw_date,
    'whatsapp_number',    c.whatsapp_number,
    'instagram_url',      c.instagram_url
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

-- ── 7. Atualizar trigger de automação (payload Draw Engine) ───

CREATE OR REPLACE FUNCTION fn_enqueue_participant_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant participants%ROWTYPE;
  v_campaign    campaigns%ROWTYPE;
BEGIN
  SELECT * INTO v_participant FROM participants WHERE id = NEW.participant_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO v_campaign FROM campaigns WHERE id = NEW.campaign_id;

  INSERT INTO automation_queue (
    event_type, entity_type, entity_id, campaign_id, payload
  ) VALUES (
    'participant.created',
    'participant',
    v_participant.id,
    v_participant.campaign_id,
    jsonb_build_object(
      'participant_id',     v_participant.id,
      'campaign_id',        v_participant.campaign_id,
      'campaign_slug',      v_campaign.slug,
      -- Draw Engine (novo)
      'sequence_number',    v_participant.sequence_number,
      'display_number',     v_participant.display_number,
      'display_number_fmt', v_participant.display_number_fmt,
      'display_hash',       v_participant.display_hash,
      -- Número formatado pronto para WhatsApp: PP-12345
      'numero_sorte',       'PP-' || COALESCE(v_participant.display_number_fmt, lpad(NEW.number::TEXT, 5, '0')),
      -- Backward compat
      'lucky_number',       NEW.number,
      -- Dados do participante
      'name',               v_participant.name,
      'whatsapp',           v_participant.whatsapp,
      'instagram',          v_participant.instagram,
      'city',               v_participant.city,
      'state',              v_participant.state,
      'created_at',         v_participant.created_at
    )
  );

  RETURN NEW;
END;
$$;

-- Recriar trigger (garante que usa a função atualizada)
DROP TRIGGER IF EXISTS trg_enqueue_participant_created ON lucky_numbers;
CREATE TRIGGER trg_enqueue_participant_created
  AFTER INSERT ON lucky_numbers
  FOR EACH ROW EXECUTE FUNCTION fn_enqueue_participant_created();

-- ── 8. Atualizar list_pp_participantes — UNION com participants ─

-- Drop first (mudança de assinatura — adiciona colunas)
DROP FUNCTION IF EXISTS list_pp_participantes(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION list_pp_participantes(
  p_search TEXT    DEFAULT NULL,
  p_limit  INTEGER DEFAULT 100
)
RETURNS TABLE (
  id                 UUID,
  nome               TEXT,
  telefone           TEXT,
  email              TEXT,
  pontos             INTEGER,
  status             TEXT,
  created_at         TIMESTAMPTZ,
  sequence_number    INTEGER,
  display_number     INTEGER,
  display_number_fmt TEXT,
  display_hash       TEXT,
  origem             TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT _pp_check_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT * FROM (
    -- Participantes do sorteio (tabela antiga, Draw Engine)
    SELECT
      p.id,
      p.name              AS nome,
      p.whatsapp          AS telefone,
      p.email,
      0                   AS pontos,
      p.status,
      p.created_at,
      p.sequence_number,
      p.display_number,
      p.display_number_fmt,
      p.display_hash,
      'sorteio'::TEXT     AS origem
    FROM participants p

    UNION ALL

    -- Participantes do admin (tabela nova pp_participantes)
    SELECT
      pp.id,
      pp.nome,
      pp.telefone,
      pp.email,
      pp.pontos,
      pp.status,
      pp.created_at,
      pp.sequence_number,
      pp.display_number,
      pp.display_number_fmt,
      pp.display_hash,
      'admin'::TEXT       AS origem
    FROM pp_participantes pp
  ) combined
  WHERE (
    p_search IS NULL
    OR combined.nome     ILIKE '%' || p_search || '%'
    OR combined.telefone ILIKE '%' || p_search || '%'
    OR combined.email    ILIKE '%' || p_search || '%'
  )
  ORDER BY combined.created_at DESC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION list_pp_participantes(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION list_pp_participantes(TEXT, INTEGER) TO authenticated;

-- ── Permissões das funções Draw Engine ───────────────────────

REVOKE ALL ON FUNCTION pp_feistel_round(BYTEA, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION pp_generate_number(TEXT, INTEGER) FROM PUBLIC;
-- Apenas SECURITY DEFINER internamente — sem exposição direta

-- ── Reload schema PostgREST ──────────────────────────────────

NOTIFY pgrst, 'reload schema';
