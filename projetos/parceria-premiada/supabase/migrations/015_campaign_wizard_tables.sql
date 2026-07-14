-- ============================================================
-- Migration 015 — Campaign Wizard: Tabelas e RPCs
-- NÃO altera nenhuma tabela/função/policy da Migration 014
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 1 — Novas colunas em campaigns
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS public_name          TEXT,
  ADD COLUMN IF NOT EXISTS company              TEXT,
  ADD COLUMN IF NOT EXISTS segment              TEXT
    CHECK (segment IN ('turismo','restaurante','clinica','comercio','servicos','evento','outro')),
  ADD COLUMN IF NOT EXISTS campaign_type        TEXT
    CHECK (campaign_type IN ('sorteio','promocao','vale_compra','evento','fidelidade','indicacao','cashback','outro')),
  ADD COLUMN IF NOT EXISTS objective            TEXT,
  ADD COLUMN IF NOT EXISTS target_audience      TEXT,
  ADD COLUMN IF NOT EXISTS internal_description TEXT,
  ADD COLUMN IF NOT EXISTS internal_owner       TEXT,
  ADD COLUMN IF NOT EXISTS prize_name           TEXT,
  ADD COLUMN IF NOT EXISTS prize_description    TEXT,
  ADD COLUMN IF NOT EXISTS prize_value          NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS winners_count        INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS currency             TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS draw_method          TEXT
    CHECK (draw_method IN ('loteria_federal','interno','plataforma_externa','manual','outro')),
  ADD COLUMN IF NOT EXISTS announcement_date    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS participant_limit    INTEGER,
  ADD COLUMN IF NOT EXISTS timezone             TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS regulation_url       TEXT,
  ADD COLUMN IF NOT EXISTS regulation_version   TEXT,
  ADD COLUMN IF NOT EXISTS is_main_campaign     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_wizard_step  INTEGER NOT NULL DEFAULT 1;

-- Apenas uma campanha principal por vez
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_one_main
  ON campaigns (is_main_campaign) WHERE is_main_campaign = TRUE;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 2 — campaign_landing_settings
-- Visual, template, tema, headline, CTA, cores
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS campaign_landing_settings (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id           UUID        NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  template_id           UUID        REFERENCES landing_templates(id),
  template_version      INTEGER,
  theme                 TEXT        CHECK (theme IN ('natureza','serra','praia','premium','familiar','minimalista','corporativo','sazonal')),
  headline              TEXT,
  subheadline           TEXT,
  cta_text              TEXT        NOT NULL DEFAULT 'Garantir meus números da sorte',
  cta_color             TEXT,
  primary_color         TEXT        NOT NULL DEFAULT '#4D0AA4',
  secondary_color       TEXT        NOT NULL DEFAULT '#F5A623',
  background_color      TEXT,
  logo_url              TEXT,
  hero_image_url        TEXT,
  hero_image_mobile_url TEXT,
  hero_image_alt        TEXT,
  badge_text            TEXT,
  microcopy             TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 3 — campaign_sections
-- Seções ordenáveis com conteúdo JSON validado por tipo
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS campaign_sections (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  section_type  TEXT        NOT NULL CHECK (section_type IN (
    'confianca','hero','form','countdown','social_proof',
    'como_funciona','premio','itens_incluidos','galeria',
    'roteiro','parceiros','depoimentos','regulamento',
    'faq','seguranca','rodape'
  )),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  display_order INTEGER     NOT NULL DEFAULT 0,
  content       JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, section_type)
);

CREATE INDEX IF NOT EXISTS idx_campaign_sections_campaign_order
  ON campaign_sections (campaign_id, display_order);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 4 — campaign_automation_settings
-- Configuração por campanha: instance, mensagens, janela de envio
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS campaign_automation_settings (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id            UUID        NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  automation_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  sender_instance        TEXT,
  official_instagram     TEXT,
  official_post_url      TEXT,
  required_mentions      INTEGER     NOT NULL DEFAULT 3,
  allowed_send_start     TIME        NOT NULL DEFAULT '08:00',
  allowed_send_end       TIME        NOT NULL DEFAULT '22:00',
  retry_limit            INTEGER     NOT NULL DEFAULT 3,
  retry_interval_minutes INTEGER     NOT NULL DEFAULT 60,
  welcome_message        TEXT,
  lucky_number_message   TEXT,
  missions_message       TEXT,
  pending_message        TEXT,
  reminder_message       TEXT,
  validated_message      TEXT,
  campaign_ended_message TEXT,
  winner_message         TEXT,
  non_winner_message     TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 5 — campaign_marketing_settings
-- SEO, Open Graph, Meta Pixel, UTM
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS campaign_marketing_settings (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id      UUID        NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  seo_title        TEXT,
  seo_description  TEXT,
  canonical_url    TEXT,
  robots_directive TEXT        NOT NULL DEFAULT 'index,follow',
  og_title         TEXT,
  og_description   TEXT,
  og_image_url     TEXT,
  og_type          TEXT        NOT NULL DEFAULT 'website',
  pixel_id         TEXT,
  pixel_events     JSONB       NOT NULL DEFAULT '{"page_view":true,"view_content":true,"lead":true,"submit_form":true,"complete_registration":true}',
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  utm_content      TEXT,
  internal_code    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 6 — Triggers updated_at (reutiliza função da 001)
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER trg_updated_at_landing_settings
  BEFORE UPDATE ON campaign_landing_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_updated_at_sections
  BEFORE UPDATE ON campaign_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_updated_at_automation_settings
  BEFORE UPDATE ON campaign_automation_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_updated_at_marketing_settings
  BEFORE UPDATE ON campaign_marketing_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- PARTE 7 — RLS: acesso exclusivo via RPC (SECURITY DEFINER)
-- Nenhuma exposição pública
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE campaign_landing_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_marketing_settings  ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_block_landing   ON campaign_landing_settings    FOR ALL USING (FALSE) WITH CHECK (FALSE);
CREATE POLICY rls_block_sections  ON campaign_sections            FOR ALL USING (FALSE) WITH CHECK (FALSE);
CREATE POLICY rls_block_auto      ON campaign_automation_settings FOR ALL USING (FALSE) WITH CHECK (FALSE);
CREATE POLICY rls_block_marketing ON campaign_marketing_settings  FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 8 — Helper: _check_campaign_admin
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION _check_campaign_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid() AND ativo = TRUE AND role IN ('admin','operador')
  )
$$;
REVOKE ALL ON FUNCTION _check_campaign_admin() FROM PUBLIC;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 9 — Helper: _validate_section_content
-- Valida estrutura JSON por tipo de seção
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION _validate_section_content(p_type TEXT, p_content JSONB)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF jsonb_typeof(p_content) <> 'object' THEN
    RETURN p_type || ': content deve ser um objeto JSON';
  END IF;
  CASE p_type
    WHEN 'faq'           THEN IF NOT (p_content ? 'questions' AND jsonb_typeof(p_content->'questions') = 'array') THEN RETURN 'faq: campo "questions" (array) obrigatório'; END IF;
    WHEN 'como_funciona' THEN IF NOT (p_content ? 'steps'     AND jsonb_typeof(p_content->'steps')     = 'array') THEN RETURN 'como_funciona: campo "steps" (array) obrigatório'; END IF;
    WHEN 'itens_incluidos' THEN IF NOT (p_content ? 'items'   AND jsonb_typeof(p_content->'items')     = 'array') THEN RETURN 'itens_incluidos: campo "items" (array) obrigatório'; END IF;
    WHEN 'galeria'       THEN IF NOT (p_content ? 'images'    AND jsonb_typeof(p_content->'images')    = 'array') THEN RETURN 'galeria: campo "images" (array) obrigatório'; END IF;
    WHEN 'depoimentos'   THEN IF NOT (p_content ? 'testimonials' AND jsonb_typeof(p_content->'testimonials') = 'array') THEN RETURN 'depoimentos: campo "testimonials" (array) obrigatório'; END IF;
    WHEN 'roteiro'       THEN IF NOT (p_content ? 'days'      AND jsonb_typeof(p_content->'days')      = 'array') THEN RETURN 'roteiro: campo "days" (array) obrigatório'; END IF;
    WHEN 'rodape'        THEN IF NOT (p_content ? 'links'     AND jsonb_typeof(p_content->'links')     = 'array') THEN RETURN 'rodape: campo "links" (array) obrigatório'; END IF;
    WHEN 'seguranca'     THEN IF NOT (p_content ? 'cards'     AND jsonb_typeof(p_content->'cards')     = 'array') THEN RETURN 'seguranca: campo "cards" (array) obrigatório'; END IF;
    ELSE NULL; -- hero, form, countdown, social_proof, premio, parceiros, confianca, regulamento: objeto livre
  END CASE;
  RETURN NULL; -- NULL = válido
END;
$$;
REVOKE ALL ON FUNCTION _validate_section_content(TEXT, JSONB) FROM PUBLIC;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 10 — RPC: admin_create_campaign
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_create_campaign(
  p_name    TEXT,
  p_slug    TEXT    DEFAULT NULL,
  p_segment TEXT    DEFAULT NULL,
  p_type    TEXT    DEFAULT NULL,
  p_company TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id   UUID;
  v_slug TEXT;
  v_secs TEXT[] := ARRAY['confianca','hero','form','countdown','social_proof','como_funciona',
                          'premio','itens_incluidos','galeria','roteiro','parceiros','depoimentos',
                          'regulamento','faq','seguranca','rodape'];
  v_sec  TEXT;
  v_ord  INTEGER := 1;
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;

  v_slug := COALESCE(p_slug,
    regexp_replace(lower(unaccent(p_name)), '[^a-z0-9]+', '-', 'g'));
  WHILE EXISTS (SELECT 1 FROM campaigns WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || floor(random()*9000+1000)::text;
  END LOOP;

  INSERT INTO campaigns (title, slug, status, segment, campaign_type, company, version, current_wizard_step)
  VALUES (p_name, v_slug, 'draft', p_segment, p_type, p_company, 1, 1)
  RETURNING id INTO v_id;

  INSERT INTO campaign_landing_settings    (campaign_id) VALUES (v_id);
  INSERT INTO campaign_automation_settings (campaign_id) VALUES (v_id);
  INSERT INTO campaign_marketing_settings  (campaign_id) VALUES (v_id);

  FOREACH v_sec IN ARRAY v_secs LOOP
    INSERT INTO campaign_sections (campaign_id, section_type, is_active, display_order, content)
    VALUES (v_id, v_sec, v_sec IN ('hero','form'), v_ord, '{}');
    v_ord := v_ord + 1;
  END LOOP;

  INSERT INTO campaign_tasks (campaign_id, name, description, action_key, required, reward_numbers, display_order, active, verification_type)
  VALUES (v_id, 'Cadastro', 'Preencher o formulário de participação', 'REGISTRATION', TRUE, 1, 1, TRUE, 'manual');

  PERFORM log_admin_action('campaign.created', 'campaign:'||v_id,
    jsonb_build_object('name', p_name, 'slug', v_slug), NULL);

  RETURN jsonb_build_object('ok', TRUE, 'campaign_id', v_id, 'slug', v_slug, 'version', 1);
END;
$$;
REVOKE ALL ON FUNCTION admin_create_campaign(TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_create_campaign(TEXT,TEXT,TEXT,TEXT,TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 11 — RPC: admin_update_campaign_step
-- Whitelist por etapa, versão atômica, rejeita campos desconhecidos
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_update_campaign_step(
  p_campaign_id UUID,
  p_step        INTEGER,
  p_data        JSONB,
  p_version     INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cur_ver INTEGER;
  v_new_ver INTEGER;
  v_err     TEXT;
  v_allowed TEXT[];
  v_key     TEXT;
  v_task    JSONB;
  v_sec     JSONB;
  v_sec_type TEXT;
  v_pid     UUID;

  -- Whitelists por etapa
  W1 CONSTANT TEXT[] := ARRAY['name','public_name','company','segment','campaign_type','objective','target_audience','internal_description','internal_owner','slug'];
  W2 CONSTANT TEXT[] := ARRAY['prize_name','prize_description','prize_value','winners_count','currency','prize_section_content','items_section_content'];
  W3 CONSTANT TEXT[] := ARRAY['start_date','end_date','draw_date','announcement_date','draw_method','participant_limit','timezone','regulation_url','regulation_version'];
  W4 CONSTANT TEXT[] := ARRAY['template_id','template_version','theme','headline','subheadline','cta_text','cta_color','primary_color','secondary_color','background_color','logo_url','hero_image_url','hero_image_mobile_url','hero_image_alt','badge_text','microcopy','sections_config'];
  W5 CONSTANT TEXT[] := ARRAY['official_post_url','instagram_url','tasks'];
  W6 CONSTANT TEXT[] := ARRAY['partner_ids'];
  W7 CONSTANT TEXT[] := ARRAY['automation_enabled','sender_instance','official_instagram','official_post_url','required_mentions','allowed_send_start','allowed_send_end','retry_limit','retry_interval_minutes','welcome_message','lucky_number_message','missions_message','pending_message','reminder_message','validated_message','campaign_ended_message','winner_message','non_winner_message'];
  W8 CONSTANT TEXT[] := ARRAY['seo_title','seo_description','canonical_url','robots_directive','og_title','og_description','og_image_url','og_type','pixel_id','pixel_events','utm_source','utm_medium','utm_campaign','utm_content','internal_code'];
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;

  SELECT version INTO v_cur_ver FROM campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  IF v_cur_ver <> p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: campanha foi alterada por outro administrador. Atualize antes de salvar novamente.';
  END IF;

  CASE p_step
    WHEN 1 THEN v_allowed := W1;
    WHEN 2 THEN v_allowed := W2;
    WHEN 3 THEN v_allowed := W3;
    WHEN 4 THEN v_allowed := W4;
    WHEN 5 THEN v_allowed := W5;
    WHEN 6 THEN v_allowed := W6;
    WHEN 7 THEN v_allowed := W7;
    WHEN 8 THEN v_allowed := W8;
    ELSE RAISE EXCEPTION 'INVALID_STEP: etapa deve ser entre 1 e 8';
  END CASE;

  FOR v_key IN SELECT jsonb_object_keys(p_data) LOOP
    IF NOT (v_key = ANY(v_allowed)) THEN
      RAISE EXCEPTION 'UNKNOWN_FIELD: campo "%" não é permitido na etapa %', v_key, p_step;
    END IF;
  END LOOP;

  -- ── Etapa 1 ──────────────────────────────────────────────────
  IF p_step = 1 THEN
    IF p_data ? 'slug' THEN
      IF (p_data->>'slug') !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' THEN
        RAISE EXCEPTION 'INVALID_SLUG: use apenas letras minúsculas, números e hífens';
      END IF;
      IF EXISTS (SELECT 1 FROM campaigns WHERE slug = p_data->>'slug' AND id <> p_campaign_id) THEN
        RAISE EXCEPTION 'DUPLICATE_SLUG: slug "%" já está em uso', p_data->>'slug';
      END IF;
    END IF;
    UPDATE campaigns SET
      title                = COALESCE(p_data->>'name',                   title),
      public_name          = COALESCE(p_data->>'public_name',            public_name),
      company              = COALESCE(p_data->>'company',                company),
      segment              = COALESCE(p_data->>'segment',                segment),
      campaign_type        = COALESCE(p_data->>'campaign_type',          campaign_type),
      objective            = COALESCE(p_data->>'objective',              objective),
      target_audience      = COALESCE(p_data->>'target_audience',        target_audience),
      internal_description = COALESCE(p_data->>'internal_description',   internal_description),
      internal_owner       = COALESCE(p_data->>'internal_owner',         internal_owner),
      slug                 = COALESCE(p_data->>'slug',                   slug),
      current_wizard_step  = GREATEST(current_wizard_step, 1),
      version = version + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
  END IF;

  -- ── Etapa 2 ──────────────────────────────────────────────────
  IF p_step = 2 THEN
    UPDATE campaigns SET
      prize_name        = COALESCE(p_data->>'prize_name',                prize_name),
      prize_description = COALESCE(p_data->>'prize_description',         prize_description),
      prize_value       = COALESCE((p_data->>'prize_value')::NUMERIC,    prize_value),
      winners_count     = COALESCE((p_data->>'winners_count')::INTEGER,  winners_count),
      currency          = COALESCE(p_data->>'currency',                  currency),
      current_wizard_step = GREATEST(current_wizard_step, 2),
      version = version + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
    IF p_data ? 'prize_section_content' THEN
      v_err := _validate_section_content('premio', p_data->'prize_section_content');
      IF v_err IS NOT NULL THEN RAISE EXCEPTION '%', v_err; END IF;
      UPDATE campaign_sections SET content = p_data->'prize_section_content', updated_at = NOW()
      WHERE campaign_id = p_campaign_id AND section_type = 'premio';
    END IF;
    IF p_data ? 'items_section_content' THEN
      v_err := _validate_section_content('itens_incluidos', p_data->'items_section_content');
      IF v_err IS NOT NULL THEN RAISE EXCEPTION '%', v_err; END IF;
      UPDATE campaign_sections SET content = p_data->'items_section_content', updated_at = NOW()
      WHERE campaign_id = p_campaign_id AND section_type = 'itens_incluidos';
    END IF;
  END IF;

  -- ── Etapa 3 ──────────────────────────────────────────────────
  IF p_step = 3 THEN
    IF (p_data ? 'start_date') AND (p_data ? 'end_date') THEN
      IF (p_data->>'end_date')::TIMESTAMPTZ <= (p_data->>'start_date')::TIMESTAMPTZ THEN
        RAISE EXCEPTION 'INVALID_DATES: encerramento deve ser após o início';
      END IF;
    END IF;
    IF (p_data ? 'draw_date') AND (p_data ? 'end_date') THEN
      IF (p_data->>'draw_date')::TIMESTAMPTZ < (p_data->>'end_date')::TIMESTAMPTZ THEN
        RAISE EXCEPTION 'INVALID_DATES: sorteio não pode ser antes do encerramento';
      END IF;
    END IF;
    UPDATE campaigns SET
      start_date         = COALESCE((p_data->>'start_date')::TIMESTAMPTZ,         start_date),
      end_date           = COALESCE((p_data->>'end_date')::TIMESTAMPTZ,           end_date),
      draw_date          = COALESCE((p_data->>'draw_date')::TIMESTAMPTZ,          draw_date),
      announcement_date  = COALESCE((p_data->>'announcement_date')::TIMESTAMPTZ,  announcement_date),
      draw_method        = COALESCE(p_data->>'draw_method',                        draw_method),
      participant_limit  = COALESCE((p_data->>'participant_limit')::INTEGER,       participant_limit),
      timezone           = COALESCE(p_data->>'timezone',                           timezone),
      regulation_url     = COALESCE(p_data->>'regulation_url',                     regulation_url),
      regulation_version = COALESCE(p_data->>'regulation_version',                 regulation_version),
      current_wizard_step = GREATEST(current_wizard_step, 3),
      version = version + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
  END IF;

  -- ── Etapa 4 ──────────────────────────────────────────────────
  IF p_step = 4 THEN
    IF p_data ? 'template_id' THEN
      IF NOT EXISTS (SELECT 1 FROM landing_templates WHERE id = (p_data->>'template_id')::UUID AND status = 'published') THEN
        RAISE EXCEPTION 'TEMPLATE_NOT_FOUND: template_id inválido ou não publicado';
      END IF;
    END IF;
    UPDATE campaign_landing_settings SET
      template_id           = COALESCE((p_data->>'template_id')::UUID,        template_id),
      template_version      = COALESCE((p_data->>'template_version')::INTEGER, template_version),
      theme                 = COALESCE(p_data->>'theme',                       theme),
      headline              = COALESCE(p_data->>'headline',                    headline),
      subheadline           = COALESCE(p_data->>'subheadline',                 subheadline),
      cta_text              = COALESCE(p_data->>'cta_text',                    cta_text),
      cta_color             = COALESCE(p_data->>'cta_color',                   cta_color),
      primary_color         = COALESCE(p_data->>'primary_color',               primary_color),
      secondary_color       = COALESCE(p_data->>'secondary_color',             secondary_color),
      background_color      = COALESCE(p_data->>'background_color',            background_color),
      logo_url              = COALESCE(p_data->>'logo_url',                    logo_url),
      hero_image_url        = COALESCE(p_data->>'hero_image_url',              hero_image_url),
      hero_image_mobile_url = COALESCE(p_data->>'hero_image_mobile_url',       hero_image_mobile_url),
      hero_image_alt        = COALESCE(p_data->>'hero_image_alt',              hero_image_alt),
      badge_text            = COALESCE(p_data->>'badge_text',                  badge_text),
      microcopy             = COALESCE(p_data->>'microcopy',                   microcopy),
      updated_at            = NOW()
    WHERE campaign_id = p_campaign_id;
    IF p_data ? 'sections_config' THEN
      FOR v_sec IN SELECT * FROM jsonb_array_elements(p_data->'sections_config') LOOP
        v_sec_type := v_sec->>'section_type';
        v_err := _validate_section_content(v_sec_type, COALESCE(v_sec->'content','{}'));
        IF v_err IS NOT NULL THEN RAISE EXCEPTION '%', v_err; END IF;
        UPDATE campaign_sections SET
          is_active     = COALESCE((v_sec->>'is_active')::BOOLEAN,    is_active),
          display_order = COALESCE((v_sec->>'display_order')::INTEGER, display_order),
          content       = COALESCE(v_sec->'content', '{}'),
          updated_at    = NOW()
        WHERE campaign_id = p_campaign_id AND section_type = v_sec_type;
      END LOOP;
    END IF;
    UPDATE campaigns SET current_wizard_step = GREATEST(current_wizard_step,4),
      version = version + 1, updated_at = NOW() WHERE id = p_campaign_id;
  END IF;

  -- ── Etapa 5 ──────────────────────────────────────────────────
  IF p_step = 5 THEN
    UPDATE campaigns SET
      instagram_url       = COALESCE(p_data->>'instagram_url',    instagram_url),
      official_post_url   = COALESCE(p_data->>'official_post_url', official_post_url),
      current_wizard_step = GREATEST(current_wizard_step, 5),
      version = version + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
    IF p_data ? 'tasks' THEN
      FOR v_task IN SELECT * FROM jsonb_array_elements(p_data->'tasks') LOOP
        IF v_task ? 'id' THEN
          UPDATE campaign_tasks SET
            name           = COALESCE(v_task->>'name',                        name),
            description    = COALESCE(v_task->>'description',                 description),
            required       = COALESCE((v_task->>'required')::BOOLEAN,         required),
            reward_numbers = COALESCE((v_task->>'reward_numbers')::INTEGER,   reward_numbers),
            display_order  = COALESCE((v_task->>'display_order')::INTEGER,    display_order),
            active         = COALESCE((v_task->>'active')::BOOLEAN,           active),
            updated_at     = NOW()
          WHERE id = (v_task->>'id')::UUID AND campaign_id = p_campaign_id
            AND action_key <> 'REGISTRATION';
        ELSE
          INSERT INTO campaign_tasks
            (campaign_id, name, description, action_key, required, reward_numbers, display_order, active, verification_type)
          VALUES (
            p_campaign_id,
            v_task->>'name',
            COALESCE(v_task->>'description',''),
            COALESCE(v_task->>'action_key', 'CUSTOM_'||floor(random()*9000+1000)::text),
            COALESCE((v_task->>'required')::BOOLEAN, FALSE),
            COALESCE((v_task->>'reward_numbers')::INTEGER, 0),
            COALESCE((v_task->>'display_order')::INTEGER, 99),
            TRUE, 'manual'
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- ── Etapa 6 ──────────────────────────────────────────────────
  IF p_step = 6 THEN
    IF p_data ? 'partner_ids' THEN
      DELETE FROM campaign_partners
      WHERE campaign_id = p_campaign_id
        AND partner_id::text NOT IN (
          SELECT value FROM jsonb_array_elements_text(p_data->'partner_ids')
        );
      FOR v_pid IN SELECT value::UUID FROM jsonb_array_elements_text(p_data->'partner_ids') LOOP
        INSERT INTO campaign_partners (campaign_id, partner_id)
        VALUES (p_campaign_id, v_pid) ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
    UPDATE campaigns SET current_wizard_step = GREATEST(current_wizard_step,6),
      version = version + 1, updated_at = NOW() WHERE id = p_campaign_id;
  END IF;

  -- ── Etapa 7 ──────────────────────────────────────────────────
  IF p_step = 7 THEN
    UPDATE campaign_automation_settings SET
      automation_enabled     = COALESCE((p_data->>'automation_enabled')::BOOLEAN,    automation_enabled),
      sender_instance        = COALESCE(p_data->>'sender_instance',                  sender_instance),
      official_instagram     = COALESCE(p_data->>'official_instagram',               official_instagram),
      official_post_url      = COALESCE(p_data->>'official_post_url',                official_post_url),
      required_mentions      = COALESCE((p_data->>'required_mentions')::INTEGER,     required_mentions),
      allowed_send_start     = COALESCE((p_data->>'allowed_send_start')::TIME,       allowed_send_start),
      allowed_send_end       = COALESCE((p_data->>'allowed_send_end')::TIME,         allowed_send_end),
      retry_limit            = COALESCE((p_data->>'retry_limit')::INTEGER,           retry_limit),
      retry_interval_minutes = COALESCE((p_data->>'retry_interval_minutes')::INTEGER, retry_interval_minutes),
      welcome_message        = COALESCE(p_data->>'welcome_message',                  welcome_message),
      lucky_number_message   = COALESCE(p_data->>'lucky_number_message',             lucky_number_message),
      missions_message       = COALESCE(p_data->>'missions_message',                 missions_message),
      pending_message        = COALESCE(p_data->>'pending_message',                  pending_message),
      reminder_message       = COALESCE(p_data->>'reminder_message',                 reminder_message),
      validated_message      = COALESCE(p_data->>'validated_message',                validated_message),
      campaign_ended_message = COALESCE(p_data->>'campaign_ended_message',           campaign_ended_message),
      winner_message         = COALESCE(p_data->>'winner_message',                   winner_message),
      non_winner_message     = COALESCE(p_data->>'non_winner_message',               non_winner_message),
      updated_at             = NOW()
    WHERE campaign_id = p_campaign_id;
    UPDATE campaigns SET current_wizard_step = GREATEST(current_wizard_step,7),
      version = version + 1, updated_at = NOW() WHERE id = p_campaign_id;
  END IF;

  -- ── Etapa 8 ──────────────────────────────────────────────────
  IF p_step = 8 THEN
    IF p_data ? 'pixel_events' AND jsonb_typeof(p_data->'pixel_events') <> 'object' THEN
      RAISE EXCEPTION 'INVALID_FIELD: pixel_events deve ser um objeto JSON';
    END IF;
    UPDATE campaign_marketing_settings SET
      seo_title        = COALESCE(p_data->>'seo_title',        seo_title),
      seo_description  = COALESCE(p_data->>'seo_description',  seo_description),
      canonical_url    = COALESCE(p_data->>'canonical_url',    canonical_url),
      robots_directive = COALESCE(p_data->>'robots_directive', robots_directive),
      og_title         = COALESCE(p_data->>'og_title',         og_title),
      og_description   = COALESCE(p_data->>'og_description',   og_description),
      og_image_url     = COALESCE(p_data->>'og_image_url',     og_image_url),
      og_type          = COALESCE(p_data->>'og_type',          og_type),
      pixel_id         = COALESCE(p_data->>'pixel_id',         pixel_id),
      pixel_events     = COALESCE(p_data->'pixel_events',      pixel_events),
      utm_source       = COALESCE(p_data->>'utm_source',       utm_source),
      utm_medium       = COALESCE(p_data->>'utm_medium',       utm_medium),
      utm_campaign     = COALESCE(p_data->>'utm_campaign',     utm_campaign),
      utm_content      = COALESCE(p_data->>'utm_content',      utm_content),
      internal_code    = COALESCE(p_data->>'internal_code',    internal_code),
      updated_at       = NOW()
    WHERE campaign_id = p_campaign_id;
    UPDATE campaigns SET current_wizard_step = GREATEST(current_wizard_step,8),
      version = version + 1, updated_at = NOW() WHERE id = p_campaign_id;
  END IF;

  SELECT version INTO v_new_ver FROM campaigns WHERE id = p_campaign_id;

  PERFORM log_admin_action('campaign.step_saved', 'campaign:'||p_campaign_id,
    jsonb_build_object('step', p_step), NULL);

  RETURN jsonb_build_object('ok', TRUE, 'new_version', v_new_ver);
END;
$$;
REVOKE ALL ON FUNCTION admin_update_campaign_step(UUID,INTEGER,JSONB,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_campaign_step(UUID,INTEGER,JSONB,INTEGER) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 12 — RPC: admin_get_campaign_checklist
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_get_campaign_checklist(p_campaign_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_c   campaigns%ROWTYPE;
  v_ls  campaign_landing_settings%ROWTYPE;
  v_as  campaign_automation_settings%ROWTYPE;
  v_items JSONB := '[]';
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO v_c  FROM campaigns                   WHERE id          = p_campaign_id;
  SELECT * INTO v_ls FROM campaign_landing_settings   WHERE campaign_id = p_campaign_id;
  SELECT * INTO v_as FROM campaign_automation_settings WHERE campaign_id = p_campaign_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;

  v_items := jsonb_build_array(
    jsonb_build_object('step',1,'field','name',        'label','Nome da campanha',        'required',TRUE, 'ok', v_c.title IS NOT NULL AND v_c.title <> ''),
    jsonb_build_object('step',1,'field','company',     'label','Empresa responsável',     'required',TRUE, 'ok', v_c.company IS NOT NULL),
    jsonb_build_object('step',1,'field','segment',     'label','Segmento',                'required',TRUE, 'ok', v_c.segment IS NOT NULL),
    jsonb_build_object('step',1,'field','campaign_type','label','Tipo de campanha',       'required',TRUE, 'ok', v_c.campaign_type IS NOT NULL),
    jsonb_build_object('step',1,'field','slug',        'label','Slug único',              'required',TRUE, 'ok', v_c.slug IS NOT NULL AND v_c.slug <> ''),
    jsonb_build_object('step',2,'field','prize_name',  'label','Nome do prêmio',          'required',TRUE, 'ok', v_c.prize_name IS NOT NULL),
    jsonb_build_object('step',3,'field','start_date',  'label','Data de início',          'required',TRUE, 'ok', v_c.start_date IS NOT NULL),
    jsonb_build_object('step',3,'field','end_date',    'label','Data de encerramento',    'required',TRUE, 'ok', v_c.end_date IS NOT NULL),
    jsonb_build_object('step',3,'field','draw_date',   'label','Data do sorteio',         'required',TRUE, 'ok', v_c.draw_date IS NOT NULL),
    jsonb_build_object('step',3,'field','draw_method', 'label','Método do sorteio',       'required',TRUE, 'ok', v_c.draw_method IS NOT NULL),
    jsonb_build_object('step',4,'field','template_id', 'label','Template de landing',     'required',TRUE, 'ok', v_ls.template_id IS NOT NULL),
    jsonb_build_object('step',4,'field','headline',    'label','Headline da landing',     'required',TRUE, 'ok', v_ls.headline IS NOT NULL AND v_ls.headline <> ''),
    jsonb_build_object('step',4,'field','cta_text',    'label','Texto do CTA',            'required',TRUE, 'ok', v_ls.cta_text IS NOT NULL),
    -- Recomendados
    jsonb_build_object('step',2,'field','prize_value', 'label','Valor estimado',          'required',FALSE,'ok', v_c.prize_value IS NOT NULL),
    jsonb_build_object('step',4,'field','hero_image',  'label','Imagem hero',             'required',FALSE,'ok', v_ls.hero_image_url IS NOT NULL),
    jsonb_build_object('step',5,'field','instagram',   'label','Instagram oficial',       'required',FALSE,'ok', v_c.instagram_url IS NOT NULL),
    jsonb_build_object('step',7,'field','automation',  'label','Automação configurada',   'required',FALSE,'ok', v_as.automation_enabled AND v_as.sender_instance IS NOT NULL)
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'items', v_items,
    'can_publish', NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_items) i
      WHERE (i->>'required')::BOOLEAN AND NOT (i->>'ok')::BOOLEAN
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION admin_get_campaign_checklist(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_campaign_checklist(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 13 — RPC: admin_publish_campaign (TRANSACIONAL)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_publish_campaign(p_campaign_id UUID, p_version INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cur_ver  INTEGER;
  v_status   TEXT;
  v_checklist JSONB;
  v_missing  JSONB;
  v_new_status TEXT;
  v_snapshot JSONB;
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;

  SELECT version, status INTO v_cur_ver, v_status
  FROM campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  IF v_cur_ver <> p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: campanha foi alterada por outro administrador.';
  END IF;
  IF v_status IN ('active','scheduled') THEN
    RAISE EXCEPTION 'ALREADY_PUBLISHED: campanha já está publicada.';
  END IF;
  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'CAMPAIGN_CANCELLED: não é possível publicar uma campanha cancelada.';
  END IF;

  v_checklist := admin_get_campaign_checklist(p_campaign_id);
  IF NOT (v_checklist->>'can_publish')::BOOLEAN THEN
    SELECT jsonb_agg(i->>'label') INTO v_missing
    FROM jsonb_array_elements(v_checklist->'items') i
    WHERE (i->>'required')::BOOLEAN AND NOT (i->>'ok')::BOOLEAN;
    RAISE EXCEPTION 'CHECKLIST_INCOMPLETE: %', v_missing;
  END IF;

  v_new_status := CASE
    WHEN (SELECT start_date FROM campaigns WHERE id = p_campaign_id) > NOW()
    THEN 'scheduled' ELSE 'active'
  END;

  SELECT jsonb_build_object(
    'campaign',         row_to_json(c)::jsonb,
    'landing_settings', row_to_json(ls)::jsonb,
    'sections', (SELECT jsonb_agg(row_to_json(s)) FROM campaign_sections s WHERE s.campaign_id = c.id),
    'tasks',    (SELECT jsonb_agg(row_to_json(t)) FROM campaign_tasks t WHERE t.campaign_id = c.id AND t.active),
    'partners', (SELECT jsonb_agg(row_to_json(p)) FROM campaign_partners cp JOIN partners p ON p.id = cp.partner_id WHERE cp.campaign_id = c.id),
    'automation', row_to_json(a)::jsonb,
    'marketing',  row_to_json(m)::jsonb
  ) INTO v_snapshot
  FROM campaigns c
  LEFT JOIN campaign_landing_settings    ls ON ls.campaign_id = c.id
  LEFT JOIN campaign_automation_settings a  ON a.campaign_id  = c.id
  LEFT JOIN campaign_marketing_settings  m  ON m.campaign_id  = c.id
  WHERE c.id = p_campaign_id;

  UPDATE campaigns SET status = v_new_status, version = version + 1, updated_at = NOW()
  WHERE id = p_campaign_id;

  INSERT INTO campaign_snapshots (campaign_id, snapshot_data, reason)
  VALUES (p_campaign_id, v_snapshot, 'publicação: ' || v_new_status);

  PERFORM log_admin_action('campaign.published', 'campaign:'||p_campaign_id,
    jsonb_build_object('status', v_new_status, 'version', v_cur_ver + 1), NULL);

  RETURN jsonb_build_object('ok', TRUE, 'status', v_new_status, 'new_version', v_cur_ver + 1);
END;
$$;
REVOKE ALL ON FUNCTION admin_publish_campaign(UUID,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_publish_campaign(UUID,INTEGER) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 14 — RPC: admin_get_campaign_wizard_state
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_get_campaign_wizard_state(p_campaign_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_r JSONB;
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT jsonb_build_object(
    'campaign',        row_to_json(c)::jsonb,
    'landing_settings',row_to_json(ls)::jsonb,
    'sections',        (SELECT jsonb_agg(row_to_json(s) ORDER BY s.display_order) FROM campaign_sections s WHERE s.campaign_id = c.id),
    'tasks',           (SELECT jsonb_agg(row_to_json(t) ORDER BY t.display_order) FROM campaign_tasks t WHERE t.campaign_id = c.id),
    'partners',        (SELECT jsonb_agg(jsonb_build_object('partner_id',cp.partner_id,'name',p.name,'instagram',p.instagram,'logo',p.logo,'category',p.category))
                        FROM campaign_partners cp JOIN partners p ON p.id = cp.partner_id WHERE cp.campaign_id = c.id),
    'automation',      row_to_json(a)::jsonb,
    'marketing',       row_to_json(m)::jsonb,
    'checklist',       admin_get_campaign_checklist(c.id)
  ) INTO v_r
  FROM campaigns c
  LEFT JOIN campaign_landing_settings    ls ON ls.campaign_id = c.id
  LEFT JOIN campaign_automation_settings a  ON a.campaign_id  = c.id
  LEFT JOIN campaign_marketing_settings  m  ON m.campaign_id  = c.id
  WHERE c.id = p_campaign_id;
  IF v_r IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  RETURN v_r;
END;
$$;
REVOKE ALL ON FUNCTION admin_get_campaign_wizard_state(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_campaign_wizard_state(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 15 — RPC: admin_duplicate_campaign
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_duplicate_campaign(p_campaign_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_id UUID;
  v_slug   TEXT;
  v_orig   campaigns%ROWTYPE;
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO v_orig FROM campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;

  v_slug := v_orig.slug || '-copia';
  WHILE EXISTS (SELECT 1 FROM campaigns WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || floor(random()*900+100)::text;
  END LOOP;

  INSERT INTO campaigns (title,public_name,slug,status,company,segment,campaign_type,objective,
    target_audience,internal_description,internal_owner,prize_name,prize_description,prize_value,
    winners_count,currency,draw_method,participant_limit,timezone,regulation_url,regulation_version,
    template_id,template_version,whatsapp_number,version,current_wizard_step)
  SELECT title||' (cópia)',public_name,v_slug,'draft',company,segment,campaign_type,objective,
    target_audience,internal_description,internal_owner,prize_name,prize_description,prize_value,
    winners_count,currency,draw_method,participant_limit,timezone,regulation_url,regulation_version,
    template_id,template_version,whatsapp_number,1,current_wizard_step
  FROM campaigns WHERE id = p_campaign_id
  RETURNING id INTO v_new_id;

  INSERT INTO campaign_landing_settings (campaign_id,template_id,template_version,theme,headline,subheadline,
    cta_text,cta_color,primary_color,secondary_color,background_color,logo_url,hero_image_url,
    hero_image_mobile_url,hero_image_alt,badge_text,microcopy)
  SELECT v_new_id,template_id,template_version,theme,headline,subheadline,cta_text,cta_color,
    primary_color,secondary_color,background_color,logo_url,hero_image_url,hero_image_mobile_url,
    hero_image_alt,badge_text,microcopy
  FROM campaign_landing_settings WHERE campaign_id = p_campaign_id;

  INSERT INTO campaign_sections (campaign_id,section_type,is_active,display_order,content)
  SELECT v_new_id,section_type,is_active,display_order,content
  FROM campaign_sections WHERE campaign_id = p_campaign_id;

  INSERT INTO campaign_tasks (campaign_id,name,description,action_key,required,reward_numbers,display_order,active,verification_type)
  SELECT v_new_id,name,description,action_key,required,reward_numbers,display_order,active,verification_type
  FROM campaign_tasks WHERE campaign_id = p_campaign_id;

  INSERT INTO campaign_partners (campaign_id,partner_id)
  SELECT v_new_id,partner_id FROM campaign_partners WHERE campaign_id = p_campaign_id;

  INSERT INTO campaign_automation_settings (campaign_id,automation_enabled,sender_instance,official_instagram,
    official_post_url,required_mentions,allowed_send_start,allowed_send_end,retry_limit,retry_interval_minutes,
    welcome_message,lucky_number_message,missions_message,pending_message,reminder_message,validated_message,
    campaign_ended_message,winner_message,non_winner_message)
  SELECT v_new_id,automation_enabled,sender_instance,official_instagram,official_post_url,required_mentions,
    allowed_send_start,allowed_send_end,retry_limit,retry_interval_minutes,welcome_message,lucky_number_message,
    missions_message,pending_message,reminder_message,validated_message,campaign_ended_message,winner_message,non_winner_message
  FROM campaign_automation_settings WHERE campaign_id = p_campaign_id;

  INSERT INTO campaign_marketing_settings (campaign_id,seo_title,seo_description,canonical_url,robots_directive,
    og_title,og_description,og_image_url,og_type,pixel_id,pixel_events,utm_source,utm_medium,utm_campaign,utm_content,internal_code)
  SELECT v_new_id,seo_title,seo_description,canonical_url,robots_directive,og_title,og_description,og_image_url,
    og_type,pixel_id,pixel_events,utm_source,utm_medium,utm_campaign,utm_content,internal_code
  FROM campaign_marketing_settings WHERE campaign_id = p_campaign_id;

  PERFORM log_admin_action('campaign.duplicated','campaign:'||v_new_id,
    jsonb_build_object('source',p_campaign_id,'slug',v_slug),NULL);
  RETURN jsonb_build_object('ok',TRUE,'new_campaign_id',v_new_id,'slug',v_slug);
END;
$$;
REVOKE ALL ON FUNCTION admin_duplicate_campaign(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_duplicate_campaign(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 16 — RPC: admin_set_main_campaign
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_set_main_campaign(p_campaign_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM campaigns WHERE id = p_campaign_id AND status IN ('active','scheduled')) THEN
    RAISE EXCEPTION 'CAMPAIGN_NOT_ACTIVE: apenas campanhas ativas ou agendadas podem ser a principal';
  END IF;
  UPDATE campaigns SET is_main_campaign = FALSE, updated_at = NOW() WHERE is_main_campaign = TRUE;
  UPDATE campaigns SET is_main_campaign = TRUE,  version = version + 1, updated_at = NOW() WHERE id = p_campaign_id;
  PERFORM log_admin_action('campaign.set_main','campaign:'||p_campaign_id,'{}',NULL);
  RETURN jsonb_build_object('ok', TRUE);
END;
$$;
REVOKE ALL ON FUNCTION admin_set_main_campaign(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_set_main_campaign(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 17 — RPC: admin_list_campaigns_v2
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_list_campaigns_v2(
  p_status  TEXT    DEFAULT NULL,
  p_segment TEXT    DEFAULT NULL,
  p_search  TEXT    DEFAULT NULL,
  p_limit   INTEGER DEFAULT 50,
  p_offset  INTEGER DEFAULT 0
) RETURNS TABLE (
  id                  UUID,
  title               TEXT,
  public_name         TEXT,
  slug                TEXT,
  company             TEXT,
  segment             TEXT,
  campaign_type       TEXT,
  status              TEXT,
  is_main_campaign    BOOLEAN,
  start_date          TIMESTAMPTZ,
  end_date            TIMESTAMPTZ,
  draw_date           TIMESTAMPTZ,
  participant_count   INTEGER,
  current_wizard_step INTEGER,
  template_name       TEXT,
  updated_at          TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT _check_campaign_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  RETURN QUERY
  SELECT c.id, c.title, c.public_name, c.slug, c.company, c.segment, c.campaign_type,
         c.status, c.is_main_campaign, c.start_date, c.end_date, c.draw_date,
         c.participant_count, c.current_wizard_step, lt.name, c.updated_at
  FROM campaigns c
  LEFT JOIN landing_templates lt ON lt.id = c.template_id AND lt.version = c.template_version
  WHERE (p_status  IS NULL OR c.status  = p_status)
    AND (p_segment IS NULL OR c.segment = p_segment)
    AND (p_search  IS NULL OR c.title ILIKE '%'||p_search||'%' OR c.slug ILIKE '%'||p_search||'%')
  ORDER BY c.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
REVOKE ALL ON FUNCTION admin_list_campaigns_v2(TEXT,TEXT,TEXT,INTEGER,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_list_campaigns_v2(TEXT,TEXT,TEXT,INTEGER,INTEGER) TO authenticated;

COMMIT;
