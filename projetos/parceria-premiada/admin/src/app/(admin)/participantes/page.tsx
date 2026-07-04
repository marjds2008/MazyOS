"use client";

import { useEffect, useState } from "react";
import { UserCheck, Search, Trophy, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Participante {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  pontos: number;
  status: string;
  created_at: string;
}

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("list_pp_participantes", { p_search: search || null, p_limit: 100 });
        if (error) setError(error.message);
        else setParticipantes((data as Participante[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [search]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Participantes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{participantes.length} cadastrados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Nome, telefone ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Carregando participantes...</div>
      ) : participantes.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <UserCheck className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum participante encontrado</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <span>Participante</span><span>Contato</span><span>Pontos</span><span>Status</span>
          </div>
          {participantes.map(p => (
            <div key={p.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">{p.nome.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.nome}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 min-w-0">
                <div>{p.telefone}</div>
                {p.email && <div className="text-xs truncate">{p.email}</div>}
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <Star className="w-3.5 h-3.5" /> {p.pontos}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                p.status === "ativo"
                  ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400"
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
