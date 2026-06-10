"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, ExternalLink } from "lucide-react";
import type { Lead } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo", contatado: "Contatado", negociando: "Negociando",
  fechado: "Fechado", perdido: "Perdido",
};
const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700", contatado: "bg-yellow-100 text-yellow-700",
  negociando: "bg-purple-100 text-purple-700", fechado: "bg-green-100 text-green-700",
  perdido: "bg-gray-100 text-gray-500",
};

const FILTERS = ["todos", "novo", "contatado", "negociando", "fechado", "perdido"];

type LeadWithViagem = Lead & { viagens?: { titulo: string } | null };

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithViagem[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("leads").select("*, viagens(titulo)").order("criado_em", { ascending: false });
    if (filtro !== "todos") q = q.eq("status", filtro);
    const { data } = await q;
    setLeads((data ?? []) as LeadWithViagem[]);
    setLoading(false);
  }, [filtro]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as Lead["status"] } : l));
  }

  function waLink(phone: string, nome: string) {
    const msg = encodeURIComponent(`Olá ${nome}! Vi sua mensagem sobre a excursão da Amo Viajar. Posso te ajudar?`);
    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;
  }

  function fmtTs(ts: string) {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} resultado{leads.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              filtro === f ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f === "todos" ? "Todos" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
        ) : !leads.length ? (
          <div className="py-16 text-center text-gray-400 text-sm">Nenhum lead encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nome", "WhatsApp", "Cidade", "Viagem de interesse", "Data", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{l.nome}</div>
                      {l.mensagem && <div className="text-gray-400 text-xs mt-0.5 max-w-xs truncate">{l.mensagem}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={waLink(l.whatsapp, l.nome)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-green-600 font-medium hover:text-green-700">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {l.whatsapp}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.cidade || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                      {l.viagens?.titulo ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{fmtTs(l.criado_em)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={l.status}
                        onChange={e => changeStatus(l.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer appearance-none ${STATUS_COLORS[l.status]}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
                          <option key={val} value={val}>{lbl}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={waLink(l.whatsapp, l.nome)} target="_blank" rel="noopener noreferrer"
                        className="text-brand-primary text-xs font-medium hover:underline">
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
