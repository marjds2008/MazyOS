"use client";

import { useEffect, useState } from "react";
import { Store, Plus, MapPin, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Parceiro {
  id: string;
  nome: string;
  segmento: string | null;
  telefone: string | null;
  cidade: string | null;
  ativo: boolean;
  created_at: string;
}

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("list_pp_parceiros");
        if (error) setError(error.message);
        else setParceiros((data as Parceiro[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parceiros</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Empresas patrocinadoras</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" /> Novo parceiro
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Carregando parceiros...</div>
      ) : parceiros.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <Store className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum parceiro cadastrado ainda</p>
          <button className="btn-primary mt-2"><Plus className="w-4 h-4" /> Adicionar parceiro</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parceiros.map(p => (
            <div key={p.id} className="card p-5 hover:shadow-md dark:hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.ativo
                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400"
                }`}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{p.nome}</h3>
              {p.segmento && <p className="text-xs text-gray-400 mt-0.5">{p.segmento}</p>}
              <div className="mt-3 space-y-1">
                {p.cidade && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5" /> {p.cidade}
                  </div>
                )}
                {p.telefone && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Phone className="w-3.5 h-3.5" /> {p.telefone}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
