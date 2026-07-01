-- ============================================================
-- Parceria Premiada — Motor de Regras e Gamificação
-- Sprint 5: Tarefas, ações, notificações e recompensas
-- Migration: 003
-- ============================================================

-- ── Helper: atualizar updated_at automaticamente ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- TABELA: campaign_tasks
-- Define as tarefas que um participante deve cumprir em cada campanha.
-- action_key identifica o tipo: REGISTRATION, FOLLOW_INSTAGRAM, FOLLOW_PARTNERS,
-- LIKE_POST, TAG_FRIENDS, JOIN_CHANNEL, SHARE_STORY, REFER_FRIEND
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_tasks (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id    UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  description    TEXT,
  action_key     TEXT        NOT NULL,
  required       BOOLEAN     NOT NULL DEFAULT true,
  reward_numbers INTEGER     NOT NULL DEFAULT 0,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  active         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, action_key)
);

ALTER TABLE campaign_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_tasks_anon_select"
  ON campaign_tasks FOR SELECT TO anon USING (active = true);

DROP TRIGGER IF EXISTS campaign_tasks_updated_at ON campaign_tasks;
CREATE TRIGGER campaign_tasks_updated_at
  BEFORE UPDATE ON campaign_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- TABELA: participant_actions
-- Registra o cumprimento (ou tentativa) de cada tarefa por cada participante.
-- status: pending → completed | rejected
-- proof_url: screenshot, link ou evidência da ação
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS participant_actions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id   UUID        NOT NULL REFERENCES participants(id)    ON DELETE CASCADE,
  campaign_task_id UUID        NOT NULL REFERENCES campaign_tasks(id)  ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  completed_at     TIMESTAMPTZ,
  proof_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id, campaign_task_id)
);

ALTER TABLE participant_actions ENABLE ROW LEVEL SECURITY;
-- Sem policy anon: dados privados acessíveis apenas via RPCs SECURITY DEFINER

DROP TRIGGER IF EXISTS participant_actions_updated_at ON participant_actions;
CREATE TRIGGER participant_actions_updated_at
  BEFORE UPDATE ON participant_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- TABELA: notifications
-- Fila de notificações pronta para integração com múltiplos canais.
--
-- HOOK Evolution API: consumir registros channel='whatsapp' e status='pending'
-- HOOK N8N:          monitorar esta tabela e disparar fluxos por tipo
-- HOOK Email:        integrar com SMTP ou SendGrid para channel='email'
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID        NOT NULL REFERENCES participants(id)  ON DELETE CASCADE,
  campaign_id    UUID        NOT NULL REFERENCES campaigns(id)     ON DELETE CASCADE,
  channel        TEXT        NOT NULL CHECK (channel IN ('whatsapp', 'email', 'push', 'sms')),
  type           TEXT        NOT NULL, -- welcome | task_reminder | validation | winner_announcement
  title          TEXT        NOT NULL,
  message        TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Sem policy anon: acessível apenas via service_role ou RPCs SECURITY DEFINER

CREATE INDEX IF NOT EXISTS idx_notifications_pending
  ON notifications (channel, status) WHERE status = 'pending';

-- ────────────────────────────────────────────────────────────────────────────
-- TABELA: reward_rules
-- Define quantos números da sorte cada tipo de ação gera.
--
-- HOOK Rewards: consultar esta tabela ao completar uma ação para emitir
--               números bônus automaticamente
-- HOOK CRM:    registrar pontos ou benefícios no sistema de CRM
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reward_rules (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id     UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  action_key      TEXT        NOT NULL,
  numbers_awarded INTEGER     NOT NULL DEFAULT 1,
  repeatable      BOOLEAN     NOT NULL DEFAULT false,
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, action_key)
);

ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_rules_anon_select"
  ON reward_rules FOR SELECT TO anon USING (active = true);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaign_tasks_campaign
  ON campaign_tasks (campaign_id, display_order) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_participant_actions_participant
  ON participant_actions (participant_id);

CREATE INDEX IF NOT EXISTS idx_participant_actions_task_status
  ON participant_actions (campaign_task_id, status);

-- ────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Auto-criar ação REGISTRATION ao cadastrar participante
--
-- Quando um participante é inserido, cria automaticamente o registro de
-- conclusão da tarefa REGISTRATION. O próprio cadastro cumpre esta tarefa.
--
-- HOOK Rewards: futuramente verificar reward_rules e emitir números bônus aqui
-- HOOK N8N:     futuramente enfileirar notificação de boas-vindas
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_auto_registration_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO participant_actions (participant_id, campaign_task_id, status, completed_at)
  SELECT
    NEW.id,
    ct.id,
    'completed',
    NOW()
  FROM campaign_tasks ct
  WHERE ct.campaign_id = NEW.campaign_id
    AND ct.action_key  = 'REGISTRATION'
    AND ct.active      = true
  LIMIT 1
  ON CONFLICT (participant_id, campaign_task_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_registration_action ON participants;
CREATE TRIGGER trg_auto_registration_action
  AFTER INSERT ON participants
  FOR EACH ROW EXECUTE FUNCTION fn_auto_registration_action();

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: get_participant_progress
-- Retorna o progresso completo de um participante: dados pessoais, número da
-- sorte, total/concluídas, percentual e lista de tarefas com status individual.
--
-- Usado pelo painel admin (modal) e futuramente pela página do participante.
-- TODO SECURITY: Acessível via anon key — proteger com auth antes do deploy público.
--
-- HOOK N8N: disparar fluxo de onboarding/lembrete quando progress < 100%
-- HOOK CRM: sincronizar progresso com sistema de CRM externo
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_participant_progress(p_participant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant  participants%ROWTYPE;
  v_campaign     campaigns%ROWTYPE;
  v_lucky_number INTEGER;
  v_total        BIGINT;
  v_completed    BIGINT;
  v_tasks_json   JSON;
BEGIN
  SELECT * INTO v_participant FROM participants WHERE id = p_participant_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Participante não encontrado.', 'code', 'NOT_FOUND');
  END IF;

  SELECT * INTO v_campaign FROM campaigns WHERE id = v_participant.campaign_id;

  SELECT number INTO v_lucky_number
  FROM lucky_numbers
  WHERE participant_id = p_participant_id AND status = 'active'
  LIMIT 1;

  SELECT COUNT(*) INTO v_total
  FROM campaign_tasks
  WHERE campaign_id = v_participant.campaign_id AND active = true;

  SELECT COUNT(*) INTO v_completed
  FROM participant_actions pa
  JOIN campaign_tasks ct ON ct.id = pa.campaign_task_id
  WHERE pa.participant_id = p_participant_id
    AND pa.status = 'completed'
    AND ct.active = true;

  SELECT json_agg(
    json_build_object(
      'task_id',       ct.id,
      'name',          ct.name,
      'description',   ct.description,
      'action_key',    ct.action_key,
      'required',      ct.required,
      'reward_numbers', ct.reward_numbers,
      'display_order', ct.display_order,
      'status',        COALESCE(pa.status, 'pending'),
      'completed_at',  pa.completed_at,
      'proof_url',     pa.proof_url
    )
    ORDER BY ct.display_order ASC
  ) INTO v_tasks_json
  FROM campaign_tasks ct
  LEFT JOIN participant_actions pa
    ON pa.campaign_task_id = ct.id AND pa.participant_id = p_participant_id
  WHERE ct.campaign_id = v_participant.campaign_id AND ct.active = true;

  RETURN json_build_object(
    'participant_id',   v_participant.id,
    'name',             v_participant.name,
    'campaign_title',   v_campaign.title,
    'campaign_slug',    v_campaign.slug,
    'lucky_number',     v_lucky_number,
    'tasks_total',      v_total,
    'tasks_completed',  v_completed,
    'progress_percent', CASE
      WHEN v_total > 0 THEN ROUND((v_completed::DECIMAL / v_total) * 100)
      ELSE 0
    END,
    'tasks', COALESCE(v_tasks_json, '[]'::json)
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- RPC: admin_list_campaign_tasks
-- Retorna todas as tarefas de uma campanha com contagem de participantes
-- por status. Usado para gestão de tarefas no painel admin.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_list_campaign_tasks(p_campaign_slug TEXT)
RETURNS TABLE(
  task_id         UUID,
  name            TEXT,
  description     TEXT,
  action_key      TEXT,
  required        BOOLEAN,
  reward_numbers  INTEGER,
  display_order   INTEGER,
  active          BOOLEAN,
  total_actions   BIGINT,
  completed_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_campaign_id UUID;
BEGIN
  SELECT id INTO v_campaign_id FROM campaigns WHERE slug = p_campaign_slug;
  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    ct.id,
    ct.name,
    ct.description,
    ct.action_key,
    ct.required,
    ct.reward_numbers,
    ct.display_order,
    ct.active,
    COUNT(pa.id)                                         AS total_actions,
    COUNT(pa.id) FILTER (WHERE pa.status = 'completed') AS completed_count
  FROM campaign_tasks ct
  LEFT JOIN participant_actions pa ON pa.campaign_task_id = ct.id
  WHERE ct.campaign_id = v_campaign_id
  GROUP BY ct.id
  ORDER BY ct.display_order ASC;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- SEED: Tarefas iniciais — Santa Rita de Jacutinga
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM campaigns WHERE slug = 'santa-rita-jacutinga';
  IF NOT FOUND THEN
    RAISE NOTICE 'Campanha santa-rita-jacutinga não encontrada. Pulando seed.';
    RETURN;
  END IF;

  INSERT INTO campaign_tasks (campaign_id, name, description, action_key, required, reward_numbers, display_order)
  VALUES
    (v_id, 'Cadastro',          'Preencher o formulário de participação',              'REGISTRATION',     true, 1, 1),
    (v_id, 'Seguir Instagram',  'Seguir o perfil oficial no Instagram',                'FOLLOW_INSTAGRAM', true, 0, 2),
    (v_id, 'Seguir Parceiros',  'Seguir todos os parceiros oficiais do sorteio',       'FOLLOW_PARTNERS',  true, 0, 3),
    (v_id, 'Curtir Publicação', 'Curtir a publicação oficial do sorteio no Instagram', 'LIKE_POST',        true, 0, 4),
    (v_id, 'Marcar 3 Amigos',  'Marcar 3 amigos reais nos comentários',               'TAG_FRIENDS',      true, 0, 5)
  ON CONFLICT (campaign_id, action_key) DO NOTHING;

  -- Recompensa: cadastro gera 1 número da sorte
  INSERT INTO reward_rules (campaign_id, action_key, numbers_awarded, repeatable, active)
  VALUES (v_id, 'REGISTRATION', 1, false, true)
  ON CONFLICT (campaign_id, action_key) DO NOTHING;

  RAISE NOTICE 'Seed: 5 tarefas + 1 reward_rule inseridas para santa-rita-jacutinga.';
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- BACKFILL: Criar ação REGISTRATION para participantes já existentes
-- Garante que quem cadastrou antes desta migration apareça com Cadastro=Concluído
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO participant_actions (participant_id, campaign_task_id, status, completed_at)
SELECT
  p.id,
  ct.id,
  'completed',
  p.created_at
FROM participants p
JOIN campaign_tasks ct
  ON ct.campaign_id = p.campaign_id
  AND ct.action_key = 'REGISTRATION'
  AND ct.active     = true
ON CONFLICT (participant_id, campaign_task_id) DO NOTHING;
