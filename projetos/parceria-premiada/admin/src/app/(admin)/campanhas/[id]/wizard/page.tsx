"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCampaignWizard } from "@/hooks/useCampaignWizard";
import type { CampaignWizardState, CampaignTask } from "@/lib/types/campaign";
import {
  ChevronLeft, ChevronRight, Check, Loader2, AlertCircle, CheckCircle2,
  Building2, Gift, Calendar, Palette, ListChecks, Store, MessageCircle, BarChart2, Rocket,
} from "lucide-react";

// ─── Step metadata ──────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Identidade",  icon: Building2,     desc: "Nome, empresa e segmento" },
  { n: 2, label: "Prêmio",      icon: Gift,          desc: "O que o participante ganha" },
  { n: 3, label: "Datas",       icon: Calendar,      desc: "Início, encerramento e sorteio" },
  { n: 4, label: "Visual",      icon: Palette,       desc: "Template e identidade da landing" },
  { n: 5, label: "Missões",     icon: ListChecks,    desc: "Tarefas e engajamento" },
  { n: 6, label: "Parceiros",   icon: Store,         desc: "Empresas patrocinadoras" },
  { n: 7, label: "Automação",   icon: MessageCircle, desc: "Mensagens WhatsApp" },
  { n: 8, label: "Marketing",   icon: BarChart2,     desc: "SEO, Pixel e UTM" },
  { n: 9, label: "Publicar",    icon: Rocket,        desc: "Checklist e publicação" },
];

const SEGMENTS = [
  { v: "turismo",     l: "Turismo" },
  { v: "restaurante", l: "Restaurante" },
  { v: "clinica",     l: "Clínica" },
  { v: "comercio",    l: "Comércio" },
  { v: "servicos",    l: "Serviços" },
  { v: "evento",      l: "Evento" },
  { v: "outro",       l: "Outro" },
];

const TYPES = [
  { v: "sorteio",      l: "Sorteio" },
  { v: "promocao",     l: "Promoção" },
  { v: "vale_compra",  l: "Vale-compra" },
  { v: "evento",       l: "Evento" },
  { v: "fidelidade",   l: "Fidelidade" },
  { v: "indicacao",    l: "Indicação" },
  { v: "cashback",     l: "Cashback" },
  { v: "outro",        l: "Outro" },
];

const DRAW_METHODS = [
  { v: "loteria_federal",    l: "Loteria Federal" },
  { v: "interno",            l: "Sorteio interno" },
  { v: "plataforma_externa", l: "Plataforma externa" },
  { v: "manual",             l: "Manual" },
  { v: "outro",              l: "Outro" },
];

const THEMES = [
  { v: "natureza",     l: "Natureza" },
  { v: "serra",        l: "Serra" },
  { v: "praia",        l: "Praia" },
  { v: "premium",      l: "Premium" },
  { v: "familiar",     l: "Familiar" },
  { v: "minimalista",  l: "Minimalista" },
  { v: "corporativo",  l: "Corporativo" },
  { v: "sazonal",      l: "Sazonal" },
];

// ─── Shared UI primitives ────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const cls = {
  input: "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-colors",
  textarea: "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-colors resize-none",
  select: "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-colors",
};

// ─── Step 1 — Identidade ─────────────────────────────────────────────────────

function Step1({ state, onChange }: { state: CampaignWizardState; onChange: (k: string, v: string) => void }) {
  const c = state.campaign;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Nome interno da campanha *" hint="Usado no painel — o público não vê">
        <input className={cls.input} defaultValue={c.title ?? ""} onBlur={e => onChange("name", e.target.value)} placeholder="Ex: Fazenda das Flores — Jul/26" />
      </Field>
      <Field label="Nome público" hint="Título que aparece na landing page">
        <input className={cls.input} defaultValue={c.public_name ?? ""} onBlur={e => onChange("public_name", e.target.value)} placeholder="Ex: Sorteio Fazenda das Flores" />
      </Field>
      <Field label="Empresa responsável *">
        <input className={cls.input} defaultValue={c.company ?? ""} onBlur={e => onChange("company", e.target.value)} placeholder="Ex: Amo Viajar" />
      </Field>
      <Field label="Responsável interno">
        <input className={cls.input} defaultValue={c.internal_owner ?? ""} onBlur={e => onChange("internal_owner", e.target.value)} placeholder="Ex: Marcio" />
      </Field>
      <Field label="Segmento *">
        <select className={cls.select} defaultValue={c.segment ?? ""} onChange={e => onChange("segment", e.target.value)}>
          <option value="">Selecione…</option>
          {SEGMENTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </Field>
      <Field label="Tipo de campanha *">
        <select className={cls.select} defaultValue={c.campaign_type ?? ""} onChange={e => onChange("campaign_type", e.target.value)}>
          <option value="">Selecione…</option>
          {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </Field>
      <Field label="Slug (URL)" hint="Somente letras minúsculas, números e hífens">
        <input className={cls.input} defaultValue={c.slug ?? ""} onBlur={e => onChange("slug", e.target.value)} placeholder="fazenda-das-flores" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Objetivo">
          <textarea className={cls.textarea} rows={2} defaultValue={c.objective ?? ""} onBlur={e => onChange("objective", e.target.value)} placeholder="O que essa campanha precisa atingir?" />
        </Field>
      </div>
      <Field label="Público-alvo">
        <textarea className={cls.textarea} rows={2} defaultValue={c.target_audience ?? ""} onBlur={e => onChange("target_audience", e.target.value)} placeholder="Quem você quer atingir?" />
      </Field>
      <Field label="Descrição interna">
        <textarea className={cls.textarea} rows={2} defaultValue={c.internal_description ?? ""} onBlur={e => onChange("internal_description", e.target.value)} placeholder="Contexto interno da campanha" />
      </Field>
    </div>
  );
}

// ─── Step 2 — Prêmio ─────────────────────────────────────────────────────────

function Step2({ state, onChange }: { state: CampaignWizardState; onChange: (k: string, v: string | number) => void }) {
  const c = state.campaign;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2">
        <Field label="Nome do prêmio *">
          <input className={cls.input} defaultValue={c.prize_name ?? ""} onBlur={e => onChange("prize_name", e.target.value)} placeholder="Ex: Viagem para Fazenda das Flores para 2 pessoas" />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Descrição do prêmio">
          <textarea className={cls.textarea} rows={3} defaultValue={c.prize_description ?? ""} onBlur={e => onChange("prize_description", e.target.value)} placeholder="Detalhe o que está incluído no prêmio" />
        </Field>
      </div>
      <Field label="Valor estimado (R$)">
        <input type="number" step="0.01" className={cls.input} defaultValue={c.prize_value ?? ""} onBlur={e => onChange("prize_value", parseFloat(e.target.value) || 0)} placeholder="0,00" />
      </Field>
      <Field label="Número de ganhadores">
        <input type="number" min="1" className={cls.input} defaultValue={c.winners_count} onBlur={e => onChange("winners_count", parseInt(e.target.value) || 1)} />
      </Field>
    </div>
  );
}

// ─── Step 3 — Datas ───────────────────────────────────────────────────────────

function Step3({ state, onChange }: { state: CampaignWizardState; onChange: (k: string, v: string) => void }) {
  const c = state.campaign;
  const toDate = (v: string | null) => v ? v.slice(0, 16) : "";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Data de início *">
        <input type="datetime-local" className={cls.input} defaultValue={toDate(c.start_date)} onBlur={e => onChange("start_date", e.target.value ? new Date(e.target.value).toISOString() : "")} />
      </Field>
      <Field label="Data de encerramento *">
        <input type="datetime-local" className={cls.input} defaultValue={toDate(c.end_date)} onBlur={e => onChange("end_date", e.target.value ? new Date(e.target.value).toISOString() : "")} />
      </Field>
      <Field label="Data do sorteio *">
        <input type="datetime-local" className={cls.input} defaultValue={toDate(c.draw_date)} onBlur={e => onChange("draw_date", e.target.value ? new Date(e.target.value).toISOString() : "")} />
      </Field>
      <Field label="Anúncio dos ganhadores">
        <input type="datetime-local" className={cls.input} defaultValue={toDate(c.announcement_date)} onBlur={e => onChange("announcement_date", e.target.value ? new Date(e.target.value).toISOString() : "")} />
      </Field>
      <Field label="Método do sorteio *">
        <select className={cls.select} defaultValue={c.draw_method ?? ""} onChange={e => onChange("draw_method", e.target.value)}>
          <option value="">Selecione…</option>
          {DRAW_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </Field>
      <Field label="Limite de participantes" hint="Deixe em branco para ilimitado">
        <input type="number" min="1" className={cls.input} defaultValue={c.participant_limit ?? ""} onBlur={e => onChange("participant_limit", e.target.value)} placeholder="Sem limite" />
      </Field>
      <Field label="URL do regulamento">
        <input className={cls.input} defaultValue={c.regulation_url ?? ""} onBlur={e => onChange("regulation_url", e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="Versão do regulamento">
        <input className={cls.input} defaultValue={c.regulation_version ?? ""} onBlur={e => onChange("regulation_version", e.target.value)} placeholder="v1.0" />
      </Field>
    </div>
  );
}

// ─── Step 4 — Visual ──────────────────────────────────────────────────────────

function Step4({ state, onChange }: { state: CampaignWizardState; onChange: (k: string, v: string) => void }) {
  const ls = state.landing_settings;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Tema visual">
        <select className={cls.select} defaultValue={ls.theme ?? ""} onChange={e => onChange("theme", e.target.value)}>
          <option value="">Selecione…</option>
          {THEMES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </Field>
      <div />
      <div className="md:col-span-2">
        <Field label="Headline *" hint="Título principal da landing page">
          <input className={cls.input} defaultValue={ls.headline ?? ""} onBlur={e => onChange("headline", e.target.value)} placeholder="Concorra a uma viagem inesquecível!" />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Subtítulo">
          <input className={cls.input} defaultValue={ls.subheadline ?? ""} onBlur={e => onChange("subheadline", e.target.value)} placeholder="Preencha o formulário e garanta sua vaga" />
        </Field>
      </div>
      <Field label="Texto do botão CTA *">
        <input className={cls.input} defaultValue={ls.cta_text} onBlur={e => onChange("cta_text", e.target.value)} placeholder="Garantir meus números da sorte" />
      </Field>
      <Field label="Badge de confiança">
        <input className={cls.input} defaultValue={ls.badge_text ?? ""} onBlur={e => onChange("badge_text", e.target.value)} placeholder="Sorteio oficial e transparente" />
      </Field>
      <Field label="Cor primária">
        <div className="flex gap-2 items-center">
          <input type="color" className="h-9 w-14 rounded cursor-pointer border border-gray-200 dark:border-gray-700 p-1" defaultValue={ls.primary_color} onBlur={e => onChange("primary_color", e.target.value)} />
          <input className={cls.input} defaultValue={ls.primary_color} onBlur={e => onChange("primary_color", e.target.value)} />
        </div>
      </Field>
      <Field label="Cor secundária">
        <div className="flex gap-2 items-center">
          <input type="color" className="h-9 w-14 rounded cursor-pointer border border-gray-200 dark:border-gray-700 p-1" defaultValue={ls.secondary_color} onBlur={e => onChange("secondary_color", e.target.value)} />
          <input className={cls.input} defaultValue={ls.secondary_color} onBlur={e => onChange("secondary_color", e.target.value)} />
        </div>
      </Field>
      <Field label="URL da imagem hero (desktop)">
        <input className={cls.input} defaultValue={ls.hero_image_url ?? ""} onBlur={e => onChange("hero_image_url", e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="URL da imagem hero (mobile)">
        <input className={cls.input} defaultValue={ls.hero_image_mobile_url ?? ""} onBlur={e => onChange("hero_image_mobile_url", e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="Alt text da imagem">
        <input className={cls.input} defaultValue={ls.hero_image_alt ?? ""} onBlur={e => onChange("hero_image_alt", e.target.value)} />
      </Field>
      <Field label="Microcopy do formulário" hint="Frase pequena abaixo do botão CTA">
        <input className={cls.input} defaultValue={ls.microcopy ?? ""} onBlur={e => onChange("microcopy", e.target.value)} placeholder="Gratuito e sem spam" />
      </Field>
    </div>
  );
}

// ─── Step 5 — Missões ────────────────────────────────────────────────────────

function Step5({
  state, onCampaignChange, onTaskSave,
}: {
  state: CampaignWizardState;
  onCampaignChange: (k: string, v: string) => void;
  onTaskSave: (tasks: Partial<CampaignTask>[]) => void;
}) {
  const c = state.campaign;
  const tasks = state.tasks ?? [];
  const [editId, setEditId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ name: "", description: "", reward_numbers: 1 });

  const editableTasks = tasks.filter(t => t.action_key !== "REGISTRATION");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="URL do post oficial (Instagram)">
          <input className={cls.input} defaultValue={c.official_post_url ?? ""} onBlur={e => onCampaignChange("official_post_url", e.target.value)} placeholder="https://instagram.com/p/…" />
        </Field>
        <Field label="Instagram oficial">
          <input className={cls.input} defaultValue={c.instagram_url ?? ""} onBlur={e => onCampaignChange("instagram_url", e.target.value)} placeholder="@seuinstagram" />
        </Field>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Missões</h3>

        {/* REGISTRATION fixa */}
        {tasks.filter(t => t.action_key === "REGISTRATION").map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 opacity-60">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.name}</p>
              <p className="text-xs text-gray-400">{t.description}</p>
            </div>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded">Padrão</span>
            <span className="text-xs text-gray-500">+{t.reward_numbers} núm.</span>
          </div>
        ))}

        {editableTasks.map(t => (
          <div key={t.id} className="flex items-start gap-3 p-3 mb-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {editId === t.id ? (
              <div className="flex-1 grid grid-cols-1 gap-2">
                <input className={cls.input} defaultValue={t.name}
                  onBlur={e => onTaskSave([{ ...t, name: e.target.value }])} />
                <div className="flex gap-2">
                  <input type="number" min="0" className={cls.input} defaultValue={t.reward_numbers}
                    onBlur={e => onTaskSave([{ ...t, reward_numbers: parseInt(e.target.value) || 0 }])} />
                  <button className="text-xs text-brand-primary" onClick={() => setEditId(null)}>OK</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                  {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                </div>
                <span className="text-xs text-gray-500 shrink-0">+{t.reward_numbers} núm.</span>
                <button onClick={() => setEditId(t.id)} className="text-xs text-brand-primary shrink-0">Editar</button>
              </>
            )}
          </div>
        ))}

        {/* Nova missão */}
        <div className="p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 space-y-2">
          <p className="text-xs font-medium text-gray-500">Nova missão</p>
          <div className="flex gap-2">
            <input className={cls.input} placeholder="Nome da missão" value={newTask.name}
              onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} />
            <input type="number" min="0" className={`w-24 ${cls.input}`} placeholder="Núm." value={newTask.reward_numbers}
              onChange={e => setNewTask(p => ({ ...p, reward_numbers: parseInt(e.target.value) || 0 }))} />
            <button
              disabled={!newTask.name.trim()}
              className="shrink-0 px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium disabled:opacity-40"
              onClick={() => {
                if (!newTask.name.trim()) return;
                onTaskSave([{
                  name: newTask.name,
                  description: newTask.description,
                  reward_numbers: newTask.reward_numbers,
                  required: false,
                  active: true,
                }]);
                setNewTask({ name: "", description: "", reward_numbers: 1 });
              }}>
              + Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6 — Parceiros ───────────────────────────────────────────────────────

function Step6({
  state, onSave,
}: {
  state: CampaignWizardState;
  onSave: (ids: string[]) => void;
}) {
  const [allPartners, setAllPartners] = useState<Array<{ id: string; name: string; category: string | null; logo: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const selected = new Set((state.partners ?? []).map(p => p.partner_id));

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("partners").select("id,name,category,logo").order("name");
      setAllPartners(data ?? []);
      setLoading(false);
    })();
  }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onSave(Array.from(next));
  }

  if (loading) return <div className="text-sm text-gray-400">Carregando parceiros…</div>;
  if (!allPartners.length) return <div className="text-sm text-gray-400">Nenhum parceiro cadastrado ainda.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {allPartners.map(p => {
        const on = selected.has(p.id);
        return (
          <button key={p.id} onClick={() => toggle(p.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
              on ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}>
            <div className={`w-5 h-5 rounded shrink-0 flex items-center justify-center border ${on ? "bg-brand-primary border-brand-primary" : "border-gray-300 dark:border-gray-600"}`}>
              {on && <Check className="w-3 h-3 text-white" />}
            </div>
            {p.logo && <img src={p.logo} alt={p.name} className="w-8 h-8 object-contain rounded" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
              {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 7 — Automação ───────────────────────────────────────────────────────

function Step7({ state, onChange }: { state: CampaignWizardState; onChange: (k: string, v: string | boolean | number) => void }) {
  const a = state.automation;
  const enabled = a?.automation_enabled ?? false;

  const msgField = (label: string, key: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <textarea className={cls.textarea} rows={3}
        defaultValue={((a as unknown) as Record<string, unknown>)?.[key] as string ?? ""}
        onBlur={e => onChange(key, e.target.value)}
        placeholder="Use {{primeiro_nome}}, {{numeros_sorte}}, {{link_post}}" />
    </Field>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onChange("automation_enabled", !enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-brand-primary" : "bg-gray-300 dark:bg-gray-600"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Automação WhatsApp</p>
          <p className="text-xs text-gray-400">{enabled ? "Ativa — mensagens serão enviadas automaticamente" : "Inativa — configure para ativar"}</p>
        </div>
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Instance Evolution API">
              <input className={cls.input} defaultValue={a?.sender_instance ?? ""} onBlur={e => onChange("sender_instance", e.target.value)} placeholder="nome-da-instance" />
            </Field>
            <Field label="Instagram oficial">
              <input className={cls.input} defaultValue={a?.official_instagram ?? ""} onBlur={e => onChange("official_instagram", e.target.value)} placeholder="@perfil" />
            </Field>
            <Field label="Menções necessárias" hint="Amigos marcados no post">
              <input type="number" min="0" max="10" className={cls.input} defaultValue={a?.required_mentions ?? 3} onBlur={e => onChange("required_mentions", parseInt(e.target.value) || 0)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horário início envio">
                <input type="time" className={cls.input} defaultValue={a?.allowed_send_start ?? "08:00"} onBlur={e => onChange("allowed_send_start", e.target.value)} />
              </Field>
              <Field label="Horário fim envio">
                <input type="time" className={cls.input} defaultValue={a?.allowed_send_end ?? "22:00"} onBlur={e => onChange("allowed_send_end", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mensagens</h3>
            {msgField("Boas-vindas / Cadastro", "welcome_message")}
            {msgField("Número da sorte gerado", "lucky_number_message", "{{numeros_sorte}}")}
            {msgField("Missões disponíveis", "missions_message")}
            {msgField("Missão pendente de validação", "pending_message")}
            {msgField("Missão validada", "validated_message")}
            {msgField("Lembrete (antes do fim)", "reminder_message")}
            {msgField("Campanha encerrada", "campaign_ended_message")}
            {msgField("Mensagem para ganhadores", "winner_message")}
            {msgField("Mensagem para não-ganhadores", "non_winner_message")}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 8 — Marketing ───────────────────────────────────────────────────────

function Step8({ state, onChange }: { state: CampaignWizardState; onChange: (k: string, v: string) => void }) {
  const m = state.marketing;
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">SEO</h3>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Título SEO" hint="Até 60 caracteres">
            <input className={cls.input} defaultValue={m?.seo_title ?? ""} onBlur={e => onChange("seo_title", e.target.value)} />
          </Field>
          <Field label="Descrição SEO" hint="Até 160 caracteres">
            <textarea className={cls.textarea} rows={2} defaultValue={m?.seo_description ?? ""} onBlur={e => onChange("seo_description", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Open Graph</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="OG Title">
            <input className={cls.input} defaultValue={m?.og_title ?? ""} onBlur={e => onChange("og_title", e.target.value)} />
          </Field>
          <Field label="OG Image URL">
            <input className={cls.input} defaultValue={m?.og_image_url ?? ""} onBlur={e => onChange("og_image_url", e.target.value)} placeholder="https://…" />
          </Field>
          <div className="md:col-span-2">
            <Field label="OG Description">
              <textarea className={cls.textarea} rows={2} defaultValue={m?.og_description ?? ""} onBlur={e => onChange("og_description", e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Meta Pixel</h3>
        <Field label="Pixel ID">
          <input className={cls.input} defaultValue={m?.pixel_id ?? ""} onBlur={e => onChange("pixel_id", e.target.value)} placeholder="123456789" />
        </Field>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">UTM</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="utm_source">
            <input className={cls.input} defaultValue={m?.utm_source ?? ""} onBlur={e => onChange("utm_source", e.target.value)} placeholder="instagram" />
          </Field>
          <Field label="utm_medium">
            <input className={cls.input} defaultValue={m?.utm_medium ?? ""} onBlur={e => onChange("utm_medium", e.target.value)} placeholder="ads" />
          </Field>
          <Field label="utm_campaign">
            <input className={cls.input} defaultValue={m?.utm_campaign ?? ""} onBlur={e => onChange("utm_campaign", e.target.value)} />
          </Field>
          <Field label="utm_content">
            <input className={cls.input} defaultValue={m?.utm_content ?? ""} onBlur={e => onChange("utm_content", e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 9 — Publicar (Checklist) ───────────────────────────────────────────

function Step9({
  state, publishing, onPublish,
}: {
  state: CampaignWizardState;
  publishing: boolean;
  onPublish: () => void;
}) {
  const { checklist, campaign } = state;
  const canPublish = checklist?.can_publish && !["active","scheduled"].includes(campaign.status);
  const alreadyPublished = ["active","scheduled"].includes(campaign.status);

  const required = checklist?.items?.filter(i => i.required) ?? [];
  const recommended = checklist?.items?.filter(i => !i.required) ?? [];
  const doneReq = required.filter(i => i.ok).length;

  const STEP_LABEL: Record<number, string> = {
    1:"Identidade", 2:"Prêmio", 3:"Datas", 4:"Visual", 5:"Missões", 6:"Parceiros", 7:"Automação", 8:"Marketing"
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - (doneReq / required.length) * 100} className="text-brand-primary transition-all" strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-primary">{doneReq}/{required.length}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {canPublish ? "Tudo pronto para publicar!" : alreadyPublished ? "Campanha já publicada" : "Complete os itens obrigatórios"}
          </p>
          <p className="text-sm text-gray-400">{doneReq} de {required.length} itens obrigatórios concluídos</p>
        </div>
      </div>

      {/* Required items */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Obrigatórios</h3>
        {required.map(item => (
          <div key={item.field} className={`flex items-center gap-3 p-3 rounded-lg border ${item.ok ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"}`}>
            {item.ok
              ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span className={`text-sm flex-1 ${item.ok ? "text-gray-700 dark:text-gray-300" : "text-red-700 dark:text-red-300"}`}>{item.label}</span>
            {!item.ok && <span className="text-xs text-gray-400 shrink-0">Etapa {item.step}: {STEP_LABEL[item.step]}</span>}
          </div>
        ))}
      </div>

      {/* Recommended items */}
      {recommended.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recomendados</h3>
          {recommended.map(item => (
            <div key={item.field} className={`flex items-center gap-3 p-3 rounded-lg border ${item.ok ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700"}`}>
              {item.ok
                ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                : <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />}
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Publish button */}
      {!alreadyPublished && (
        <button
          disabled={!canPublish || publishing}
          onClick={onPublish}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary text-white font-semibold text-sm disabled:opacity-40 hover:bg-brand-primary/90 transition-colors">
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {publishing ? "Publicando…" : "Publicar campanha"}
        </button>
      )}
      {alreadyPublished && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Campanha {campaign.status === "scheduled" ? "agendada" : "publicada e ativa"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export default function WizardPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { state, loading, saving, error, setError, saveStep, publish } = useCampaignWizard(id);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData]       = useState<Record<string, unknown>>({});
  const [publishing, setPublishing]   = useState(false);

  useEffect(() => {
    if (state) setCurrentStep(Math.min(state.campaign.current_wizard_step, 9));
  }, [state?.campaign.id]);

  const handleChange = useCallback((k: string, v: unknown) => {
    setStepData(prev => ({ ...prev, [k]: v }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!state || currentStep === 9) return;
    const ok = await saveStep(currentStep, stepData);
    if (ok) setStepData({});
    return ok;
  }, [currentStep, saveStep, stepData, state]);

  const goNext = useCallback(async () => {
    const ok = await handleSave();
    if (ok !== false) setCurrentStep(s => Math.min(s + 1, 9));
  }, [handleSave]);

  const goPrev = useCallback(() => {
    setStepData({});
    setCurrentStep(s => Math.max(s - 1, 1));
  }, []);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    const result = await publish();
    setPublishing(false);
    if (result && result.ok) {
      router.push("/campanhas");
    }
  }, [publish, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="p-6 text-sm text-red-500">Campanha não encontrada.</div>
    );
  }

  const camp = state.campaign;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar de progresso ── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="px-4 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => router.push("/campanhas")}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-3">
            <ChevronLeft className="w-3.5 h-3.5" /> Campanhas
          </button>
          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug truncate">{camp.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{camp.status === "draft" ? "Rascunho" : camp.status}</p>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {STEPS.map(s => {
            const done = s.n < currentStep || (camp.current_wizard_step >= s.n && s.n < currentStep);
            const active = s.n === currentStep;
            return (
              <button key={s.n} onClick={() => setCurrentStep(s.n)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left transition-colors ${
                  active ? "bg-brand-primary/10 text-brand-primary" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  active ? "bg-brand-primary text-white" : done ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}>
                  {done && s.n !== currentStep ? <Check className="w-3 h-3" /> : s.n}
                </div>
                <span className="text-sm font-medium truncate">{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Version */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">Versão {camp.version}</p>
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile/tablet */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 lg:hidden">
          <button onClick={() => router.push("/campanhas")} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{camp.title}</p>
          </div>
          <span className="text-xs text-gray-400">{currentStep}/9</span>
        </div>

        {/* Step header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          {(() => {
            const s = STEPS[currentStep - 1];
            const Icon = s.icon;
            return (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{s.label}</h2>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && <Step1 state={state} onChange={(k, v) => handleChange(k, v)} />}
          {currentStep === 2 && <Step2 state={state} onChange={(k, v) => handleChange(k, v)} />}
          {currentStep === 3 && <Step3 state={state} onChange={(k, v) => handleChange(k, v)} />}
          {currentStep === 4 && <Step4 state={state} onChange={(k, v) => handleChange(k, v)} />}
          {currentStep === 5 && (
            <Step5
              state={state}
              onCampaignChange={(k, v) => handleChange(k, v)}
              onTaskSave={(tasks) => handleChange("tasks", tasks)}
            />
          )}
          {currentStep === 6 && (
            <Step6
              state={state}
              onSave={(ids) => handleChange("partner_ids", ids)}
            />
          )}
          {currentStep === 7 && <Step7 state={state} onChange={(k, v) => handleChange(k, v)} />}
          {currentStep === 8 && <Step8 state={state} onChange={(k, v) => handleChange(k, v)} />}
          {currentStep === 9 && (
            <Step9 state={state} publishing={publishing} onPublish={handlePublish} />
          )}
        </div>

        {/* Navigation footer */}
        {currentStep !== 9 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button onClick={goPrev} disabled={currentStep === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving || !Object.keys(stepData).length}
                className="px-4 py-2 rounded-lg text-sm font-medium text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/5 disabled:opacity-40 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                Salvar
              </button>
              <button onClick={goNext} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-40 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {currentStep === 8 ? "Revisar" : "Próximo"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {currentStep === 9 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
