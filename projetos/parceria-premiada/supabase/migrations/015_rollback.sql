-- ============================================================
-- Migration 015 — ROLLBACK EXPLÍCITO
-- Remove apenas o que a 015 adicionou.
-- NÃO toca em nada da Migration 014.
-- ============================================================

BEGIN;

-- ── 1. RPCs ──────────────────────────────────────────────────
DROP FUNCTION IF EXISTS admin_list_campaigns_v2(TEXT,TEXT,TEXT,INTEGER,INTEGER);
DROP FUNCTION IF EXISTS admin_set_main_campaign(UUID);
DROP FUNCTION IF EXISTS admin_duplicate_campaign(UUID);
DROP FUNCTION IF EXISTS admin_get_campaign_wizard_state(UUID);
DROP FUNCTION IF EXISTS admin_publish_campaign(UUID,INTEGER);
DROP FUNCTION IF EXISTS admin_get_campaign_checklist(UUID);
DROP FUNCTION IF EXISTS admin_update_campaign_step(UUID,INTEGER,JSONB,INTEGER);
DROP FUNCTION IF EXISTS admin_create_campaign(TEXT,TEXT,TEXT,TEXT,TEXT);

-- ── 2. Helpers ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS _validate_section_content(TEXT,JSONB);
DROP FUNCTION IF EXISTS _check_campaign_admin();

-- ── 3. Triggers ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_updated_at_marketing_settings  ON campaign_marketing_settings;
DROP TRIGGER IF EXISTS trg_updated_at_automation_settings ON campaign_automation_settings;
DROP TRIGGER IF EXISTS trg_updated_at_sections            ON campaign_sections;
DROP TRIGGER IF EXISTS trg_updated_at_landing_settings    ON campaign_landing_settings;

-- ── 4. Tabelas novas (FK-safe: dependentes primeiro) ────────
DROP TABLE IF EXISTS campaign_marketing_settings;
DROP TABLE IF EXISTS campaign_automation_settings;
DROP TABLE IF EXISTS campaign_sections;
DROP TABLE IF EXISTS campaign_landing_settings;

-- ── 5. Índice parcial de campanha principal ───────────────────
DROP INDEX IF EXISTS campaigns_one_main;

-- ── 6. Colunas adicionadas em campaigns ──────────────────────
ALTER TABLE campaigns
  DROP COLUMN IF EXISTS current_wizard_step,
  DROP COLUMN IF EXISTS is_main_campaign,
  DROP COLUMN IF EXISTS regulation_version,
  DROP COLUMN IF EXISTS regulation_url,
  DROP COLUMN IF EXISTS timezone,
  DROP COLUMN IF EXISTS participant_limit,
  DROP COLUMN IF EXISTS announcement_date,
  DROP COLUMN IF EXISTS draw_method,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS winners_count,
  DROP COLUMN IF EXISTS prize_value,
  DROP COLUMN IF EXISTS prize_description,
  DROP COLUMN IF EXISTS prize_name,
  DROP COLUMN IF EXISTS internal_owner,
  DROP COLUMN IF EXISTS internal_description,
  DROP COLUMN IF EXISTS target_audience,
  DROP COLUMN IF EXISTS objective,
  DROP COLUMN IF EXISTS campaign_type,
  DROP COLUMN IF EXISTS segment,
  DROP COLUMN IF EXISTS company,
  DROP COLUMN IF EXISTS public_name;

COMMIT;
