"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, ExternalLink, ChevronRight, Plus, X } from "lucide-react";
import type { Lead, StatusLead, Viagem } from "@/types/database";

type LeadWithViagem = Lead & { viagens?: { titulo: string } | null };

const ETAPAS: { status: StatusLead; label: string; cor: string; bg: string }[] = [
  { status: "novo",        label: "Novo Lead",   cor: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  { status: "contatado",   label: "Contatado",   cor: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  { status: "negociando",  label: "Interessado", cor: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  { status: "reservado",   label: "Reservado",   cor: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  { status: "pago",        label: "Pago",        cor: "text-teal-700",   bg: "bg-teal-50 border-teal-200" },
  { status: "viajou",      label: "Viajou",      cor: "text-green-700",  bg: "bg-green-50 border-green-200" },
  { status: "perdido",     label: "Perdido",     cor: "text-gray-500",   bg: "bg-gray-50 border-gray-200" },
];

const BADGE: Record<StatusLead, string> = {
  novo:       "bg-blue-100 text-blue-700",
  contatado:  "bg-yellow-100 text-yellow-700",
  negociando: "bg-purple-100 text-purple-700",
  reservado:  "bg-orange-100 text-orange-700",
  pago:       "bg-teal-100 text-teal-700",
  viajou:     "bg-green-100 text-green-700",
  perdido:    "bg-gray-100 text-gray-500",
};

type NovoLead = { nome: string; whatsapp: string; cidade: string; viagem_id: string; mensagem: string; status: StatusLead };

const LEAD_VAZIO: NovoLead = { nome: "", whatsapp: "", cidade: "", viagem_id: "", mensagem: "", status: "novo" };

export default function FunilPage() {
  const [leads, setLeads]   = useState<LeadWithViagem[]>([]);
  const [etapa, setEtapa]   = useState<StatusLead | "todos">("todos");
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState<NovoLead>(LEAD_VAZIO);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("leads")
      .select("*, viagens(titulo)")
      .order("criado_em", { ascending: false });
    setLeads((data ?? []) as LeadWithViagem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    createClient()
      .from("viagens")
      .select("id, titulo, destino, data_saida, status")
      .in("status", ["aberta", "ultimas_vagas", "rascunho"])
      .order("data_saida", { ascending: true })
      .then(({ data }) => setViagens((data ?? []) as Viagem[]));
  }, []);

  function abrirModal() { setForm(LEAD_VAZIO); setErro(""); setModal(true); }

  async function salvarLead() {
    if (!form.nome.trim() || !form.whatsapp.trim()) {
      setErro("Nome e WhatsApp são obrigatórios.");
      return;
    }
    setSalvando(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase.from("leads").insert({
      nome:     form.nome.trim(),
      whatsapp: form.whatsapp.trim().replace(/\D/g, ""),
      cidade:   form.cidade.trim() || null,
      viagem_id: form.viagem_id || null,
      mensagem: form.mensagem.trim() || null,
      status:   form.status,
      origem:   "manual",
      quantidade_pessoas: 1,
    });
    setSalvando(false);
    if (error) { setErro(error.message); return; }
    setModal(false);
    load();
  }

  async function moverEtapa(id: string, status: StatusLead) {
    const supabase = createClient();
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  function waLink(phone: string, nome: string) {
    const msg = encodeURIComponent(`Olá ${nome}! Aqui é a Lisa da Amo Viajar ❤️`);
    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;
  }

  function fmtData(ts: string) {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  const contagem = ETAPAS.reduce((acc, e) => {
    acc[e.status] = leads.filter(l => l.status === e.status).length;
    return acc;
  }, {} as Record<StatusLead, number>);

  const visiveis = etapa === "todos" ? leads : leads.filter(l => l.status === (etapa as StatusLead));
  const etapaAtual = etapa !== "todos" ? ETAPAS.find(e => e.status === etapa) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funil Comercial</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe cada lead da captação até a viagem</p>
        </div>
        <button onClick={abrirModal} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Lead
        </button>
      </div>

      {/* Pipeline */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ETAPAS.map((e, i) => (
          <button
            key={e.status}
            onClick={() => setEtapa(etapa === e.status ? "todos" : e.status)}
            className={`flex-1 min-w-[100px] rounded-xl border p-3 text-center transition-all ${
              etapa === e.status
                ? `${e.bg} border-2 shadow-sm`
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`text-2xl font-bold ${etapa === e.status ? e.cor : "text-gray-700"}`}>
              {contagem[e.status] ?? 0}
            </div>
            <div className={`text-xs font-medium mt-0.5 ${etapa === e.status ? e.cor : "text-gray-500"}`}>
              {e.label}
            </div>
            {i < ETAPAS.length - 2 && (
              <ChevronRight className="w-3 h-3 text-gray-300 mx-auto mt-1" />
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {etapa === "todos" ? `Todos os leads (${leads.length})` : `${etapaAtual?.label} (${visiveis.length})`}
          </span>
          {etapa !== "todos" && (
            <button onClick={() => setEtapa("todos")} className="text-xs text-gray-400 hover:text-gray-600">
              Ver todos
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
        ) : !visiveis.length ? (
          <div className="py-16 text-center text-gray-400 text-sm">Nenhum lead nessa etapa.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visiveis.map(l => {
              const etapaLead = ETAPAS.find(e => e.status === l.status)!;
              const proxima   = ETAPAS[ETAPAS.indexOf(etapaLead) + 1];
              return (
                <div key={l.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{l.nome}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[l.status]}`}>
                        {etapaLead.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <a href={waLink(l.whatsapp, l.nome)} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-green-600 flex items-center gap-1 hover:text-green-700">
                        <MessageSquare className="w-3 h-3" />{l.whatsapp}
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                      {l.viagens?.titulo && (
                        <span className="text-xs text-gray-400 truncate max-w-[180px]">{l.viagens.titulo}</span>
                      )}
                      <span className="text-xs text-gray-300">{fmtData(l.criado_em)}</span>
                    </div>
                    {l.mensagem && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{l.mensagem}</p>}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    {proxima && proxima.status !== "perdido" && (
                      <button
                        onClick={() => moverEtapa(l.id, proxima.status)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${proxima.bg} ${proxima.cor} hover:opacity-80`}
                      >
                        → {proxima.label}
                      </button>
                    )}
                    <select
                      value={l.status}
                      onChange={e => moverEtapa(l.id, e.target.value as StatusLead)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white cursor-pointer"
                    >
                      {ETAPAS.map(e => (
                        <option key={e.status} value={e.status}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Modal novo lead */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Novo Lead</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input className="input" placeholder="Maria Silva"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="label">WhatsApp *</label>
                <input className="input" placeholder="21 99999-9999" inputMode="tel"
                  value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
              </div>
              <div>
                <label className="label">Cidade <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input className="input" placeholder="Rio de Janeiro"
                  value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} />
              </div>
              <div>
                <label className="label">Viagem de interesse <span className="text-gray-400 font-normal">(opcional)</span></label>
                <select className="input" value={form.viagem_id} onChange={e => setForm(f => ({ ...f, viagem_id: e.target.value }))}>
                  <option value="">— Sem viagem específica —</option>
                  {viagens.map(v => (
                    <option key={v.id} value={v.id}>{v.titulo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Etapa inicial</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusLead }))}>
                  {ETAPAS.map(e => (
                    <option key={e.status} value={e.status}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Observação <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea className="input resize-none" rows={2} placeholder="Ex: Perguntou sobre Búzios em janeiro"
                  value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} />
              </div>

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={salvarLead} disabled={salvando} className="btn-primary">
                <Plus className="w-4 h-4" />
                {salvando ? "Salvando…" : "Salvar lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
