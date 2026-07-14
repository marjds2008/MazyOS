"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Clock, Users, Star, Loader2, AlertCircle, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CampaignListItem } from "@/lib/types/campaign";

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  upcoming:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  active:    "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  ended:     "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  draft:     "Rascunho",
  upcoming:  "Em breve",
  scheduled: "Agendada",
  active:    "Ativa",
  ended:     "Encerrada",
  cancelled: "Cancelada",
};

const SEGMENT_LABEL: Record<string, string> = {
  turismo: "Turismo", restaurante: "Restaurante", clinica: "Clínica",
  comercio: "Comércio", servicos: "Serviços", evento: "Evento", outro: "Outro",
};

// ─── Modal "Nova campanha" ─────────────────────────────────────────────────

function NewCampaignModal({ onClose, onCreate }: { onClose: () => void; onCreate: (id: string) => void }) {
  const [name, setName]     = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving]  = useState(false);
  const [error, setError]    = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_create_campaign", {
        p_name:    name.trim(),
        p_company: company.trim() || null,
      });
      if (error) throw new Error(error.message);
      const { campaign_id } = data as { campaign_id: string };
      onCreate(campaign_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar campanha");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nova campanha</h2>
          <p className="text-sm text-gray-400 mt-1">Você vai configurar todos os detalhes no assistente.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome interno *</label>
            <input
              autoFocus
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
              placeholder="Ex: Fazenda das Flores — Jul/26"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
              placeholder="Ex: Amo Viajar"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim() || saving}
              className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-brand-primary/90 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Criando…" : "Criar e configurar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CampanhasPage() {
  const router = useRouter();
  const [campanhas, setCampanhas] = useState<CampaignListItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showNew, setShowNew]     = useState(false);
  const [filter, setFilter]       = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_list_campaigns_v2", {
        p_limit: 100, p_offset: 0,
      });
      if (error) throw new Error(error.message);
      setCampanhas((data as CampaignListItem[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar campanhas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? campanhas : campanhas.filter(c => c.status === filter);

  function fmt(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
  }

  return (
    <>
      {showNew && (
        <NewCampaignModal
          onClose={() => setShowNew(false)}
          onCreate={id => router.push(`/campanhas/${id}/wizard`)}
        />
      )}

      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
            <p className="text-gray-400 text-sm mt-0.5">{campanhas.length} campanha{campanhas.length !== 1 ? "s" : ""} no total</p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Nova campanha
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Filtros de status */}
        <div className="flex gap-2 flex-wrap">
          {["all", "draft", "scheduled", "active", "ended", "cancelled"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>
              {s === "all" ? "Todas" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="card p-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <Target className="w-10 h-10 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {filter === "all" ? "Nenhuma campanha ainda" : `Nenhuma campanha ${STATUS_LABEL[filter]?.toLowerCase()}`}
            </p>
            {filter === "all" && (
              <button onClick={() => setShowNew(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> Criar primeira campanha
              </button>
            )}
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                    {c.is_main_campaign && (
                      <span title="Campanha principal">
                        <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                    {c.company && <span>{c.company}</span>}
                    {c.segment && <span className="hidden sm:inline">· {SEGMENT_LABEL[c.segment] ?? c.segment}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.participant_count ?? 0}</span>
                    {c.draw_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmt(c.draw_date)}
                      </span>
                    )}
                    {c.status === "draft" && (
                      <span className="text-brand-primary">Etapa {c.current_wizard_step}/8</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[c.status] ?? STATUS_BADGE.draft}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                  <button
                    onClick={() => router.push(`/campanhas/${c.id}/wizard`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                    {c.status === "draft" ? "Continuar" : "Editar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
