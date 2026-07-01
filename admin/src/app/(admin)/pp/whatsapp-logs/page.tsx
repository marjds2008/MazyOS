"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface WaLog {
  id: string;
  participant_id: string | null;
  participant_name: string | null;
  campaign_id: string | null;
  campaign_title: string | null;
  type: string;
  phone: string | null;
  status: string;
  evolution_msg_id: string | null;
  created_at: string;
  total_count: number;
}

interface Campaign { id: string; title: string; }

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  sent:      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  delivered: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  read:      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  failed:    "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", sent: "Enviado", delivered: "Entregue", read: "Lido", failed: "Erro",
};

const STATUS_OPTIONS = ["", "pending", "sent", "delivered", "read", "failed"];
const TYPE_OPTIONS   = ["", "participant.created"];

const PAGE_SIZE = 50;

function fmtTs(ts: string) {
  return new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PPWhatsappLogsPage() {
  const [rows, setRows]           = useState<WaLog[]>([]);
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [status, setStatus]       = useState("");
  const [campanha, setCampanha]   = useState("");
  const [tipo, setTipo]           = useState("");
  const [pagina, setPagina]       = useState(0);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("campaigns")
      .select("id, title")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCampanhas(data ?? []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("admin_list_whatsapp_logs", {
      p_status:      status || null,
      p_campaign_id: campanha || null,
      p_type:        tipo || null,
      p_limit:       PAGE_SIZE,
      p_offset:      pagina * PAGE_SIZE,
    });
    const list = (data as WaLog[]) ?? [];
    setRows(list);
    setTotal(list[0]?.total_count ?? 0);
    setLoading(false);
  }, [status, campanha, tipo, pagina]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPagina(0); }, [status, campanha, tipo]);

  function copyMsgId(id: string | null) {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Logs</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} registros</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                status === s ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}>
              {STATUS_LABEL[s] ?? "Todos"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          >
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t || "Todos os tipos"}</option>)}
          </select>
          <select
            value={campanha}
            onChange={e => setCampanha(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          >
            <option value="">Todas as campanhas</option>
            {campanhas.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Participante", "Campanha", "Tipo", "Telefone", "Status", "Evolution Msg ID", "Enviado em"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {!rows.length && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">Nenhum log encontrado.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.participant_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.campaign_title ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] ?? ""}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.evolution_msg_id ? (
                        <button
                          onClick={() => copyMsgId(r.evolution_msg_id)}
                          className="font-mono text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                          title="Copiar ID"
                        >
                          {r.evolution_msg_id.slice(0, 12)}…
                          {copied === r.evolution_msg_id
                            ? <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                            : <Copy className="w-3 h-3 flex-shrink-0" />
                          }
                        </button>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtTs(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{pagina * PAGE_SIZE + 1}–{Math.min((pagina + 1) * PAGE_SIZE, total)} de {total}</span>
            <div className="flex gap-1">
              <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={pagina + 1 >= totalPages} onClick={() => setPagina(p => p + 1)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
