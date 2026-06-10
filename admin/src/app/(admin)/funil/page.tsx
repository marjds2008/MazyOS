"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, ExternalLink, ChevronRight } from "lucide-react";
import type { Lead, StatusLead } from "@/types/database";

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

export default function FunilPage() {
  const [leads, setLeads]   = useState<LeadWithViagem[]>([]);
  const [etapa, setEtapa]   = useState<StatusLead | "todos">("todos");
  const [loading, setLoading] = useState(true);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Funil Comercial</h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe cada lead da captação até a viagem</p>
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
    </div>
  );
}
