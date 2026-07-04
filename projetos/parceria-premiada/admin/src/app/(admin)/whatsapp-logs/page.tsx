"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Search, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WhatsappLog {
  id: string;
  destinatario: string;
  mensagem: string;
  status: string;
  erro: string | null;
  enviado_at: string | null;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  enviado:     "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  pendente:    "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  falhou:      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  processando: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

export default function WhatsappLogsPage() {
  const [logs,    setLogs]    = useState<WhatsappLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("todos");

  function load() {
    setLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc("list_pp_whatsapp_logs", { p_search: search || null, p_status: filter === "todos" ? null : filter, p_limit: 100 });
        setLogs((data as WhatsappLog[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }

  useEffect(load, [search, filter]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Histórico de mensagens enviadas</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar destinatário..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 max-w-xs"
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input max-w-[160px]">
          <option value="todos">Todos</option>
          <option value="enviado">Enviados</option>
          <option value="pendente">Pendentes</option>
          <option value="falhou">Falhas</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Carregando logs...</div>
      ) : logs.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {logs.map(log => {
            const Icon = log.status === "enviado" ? CheckCircle : log.status === "falhou" ? XCircle : Clock;
            return (
              <div key={log.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                      log.status === "enviado" ? "text-green-500" :
                      log.status === "falhou"  ? "text-red-500"   : "text-sky-500"
                    }`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{log.destinatario}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[log.status] ?? STATUS_BADGE.pendente}`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{log.mensagem}</p>
                      {log.erro && <p className="text-xs text-red-500 mt-1">{log.erro}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 text-right">
                    {log.enviado_at
                      ? new Date(log.enviado_at).toLocaleString("pt-BR")
                      : new Date(log.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
