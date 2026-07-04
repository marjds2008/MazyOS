"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Send, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Campanha {
  id: string;
  nome: string;
  status: string;
  total_participantes: number;
  data_sorteio: string | null;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  ativa:     "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  pausada:   "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  encerrada: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
  rascunho:  "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("list_pp_campanhas");
        if (error) setError(error.message);
        else setCampanhas((data as Campanha[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sorteios e promoções activas</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" /> Nova campanha
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Carregando campanhas...</div>
      ) : campanhas.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <Target className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma campanha ainda</p>
          <p className="text-gray-400 dark:text-gray-600 text-sm">Crie a primeira campanha para começar</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {campanhas.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{c.nome}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.total_participantes} participantes</span>
                    {c.data_sorteio && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Sorteio {new Date(c.data_sorteio).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[c.status] ?? STATUS_BADGE.rascunho}`}>
                  {c.status}
                </span>
                <button className="btn-secondary text-xs px-3 py-1.5">
                  <Send className="w-3.5 h-3.5" /> Enviar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
