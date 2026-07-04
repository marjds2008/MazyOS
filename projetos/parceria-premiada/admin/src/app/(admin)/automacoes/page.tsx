"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface AutomacaoItem {
  id: string;
  tipo: string;
  destinatario: string;
  status: "pendente" | "processando" | "enviado" | "falhou";
  tentativas: number;
  erro: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  pendente: number;
  processando: number;
  enviado: number;
  falhou: number;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  pendente:    Clock,
  processando: RefreshCw,
  enviado:     CheckCircle,
  falhou:      XCircle,
};
const STATUS_COLOR: Record<string, string> = {
  pendente:    "text-sky-500",
  processando: "text-amber-500 animate-spin",
  enviado:     "text-green-500",
  falhou:      "text-red-500",
};
const STATUS_BADGE: Record<string, string> = {
  pendente:    "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  processando: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  enviado:     "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  falhou:      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default function AutomacoesPage() {
  const [items,   setItems]   = useState<AutomacaoItem[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch("/api/automation/pending"),
        fetch("/api/automation/stats"),
      ]);
      if (listRes.ok)  setItems(await listRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function retry(id: string) {
    setRetrying(id);
    try {
      await fetch("/api/automation/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      await load();
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automações</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Fila de mensagens WhatsApp</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["pendente", "processando", "enviado", "falhou"] as const).map(s => {
            const Icon = STATUS_ICON[s];
            return (
              <div key={s} className="card p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${STATUS_COLOR[s].replace("animate-spin", "")}`} />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{stats[s]}</p>
                  <p className="text-xs text-gray-400 capitalize">{s}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Carregando fila...</div>
      ) : items.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <Zap className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Fila vazia — nenhuma mensagem pendente</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {items.map(item => {
            const Icon = STATUS_ICON[item.status] ?? Clock;
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <Icon className={`w-4 h-4 shrink-0 ${STATUS_COLOR[item.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{item.destinatario}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[item.status]}`}>{item.status}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{item.tipo}</span>
                  </div>
                  {item.erro && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertTriangle className="w-3 h-3" /> {item.erro}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.updated_at).toLocaleString("pt-BR")} · {item.tentativas} tentativa(s)
                  </p>
                </div>
                {item.status === "falhou" && (
                  <button
                    onClick={() => retry(item.id)}
                    disabled={retrying === item.id}
                    className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retrying === item.id ? "animate-spin" : ""}`} />
                    {retrying === item.id ? "Reenviando..." : "Reenviar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
