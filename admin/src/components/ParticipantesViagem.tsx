"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, UserPlus, Trash2, MapPin, MessageSquare } from "lucide-react";

type Participante = {
  id: string;
  cliente_id: string;
  valor?: number | null;
  observacoes?: string | null;
  clientes: { id: string; nome: string; whatsapp: string; cidade?: string } | null;
};

type ClienteResult = {
  id: string;
  nome: string;
  whatsapp: string;
  cidade?: string;
};

interface Props {
  viagemId: string;
  viagemDataSaida?: string;
}

export default function ParticipantesViagem({ viagemId, viagemDataSaida }: Props) {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading]             = useState(true);
  const [busca, setBusca]                 = useState("");
  const [resultados, setResultados]       = useState<ClienteResult[]>([]);
  const [buscando, setBuscando]           = useState(false);
  const [adicionando, setAdicionando]     = useState<string | null>(null);
  const [editandoValor, setEditandoValor] = useState<string | null>(null); // participacao id
  const [valorTemp, setValorTemp]         = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("participacoes")
      .select("id, cliente_id, valor, observacoes, clientes(id, nome, whatsapp, cidade)")
      .eq("viagem_id", viagemId)
      .order("criado_em", { ascending: false });
    setParticipantes((data ?? []) as unknown as Participante[]);
    setLoading(false);
  }, [viagemId]);

  useEffect(() => { carregar(); }, [carregar]);

  // Busca com debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (busca.length < 2) { setResultados([]); return; }
    timerRef.current = setTimeout(async () => {
      setBuscando(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, whatsapp, cidade")
        .or(`nome.ilike.%${busca}%,whatsapp.ilike.%${busca}%`)
        .limit(8);
      const jaAdicionados = new Set(participantes.map(p => p.cliente_id));
      setResultados((data ?? []).filter(c => !jaAdicionados.has(c.id)));
      setBuscando(false);
    }, 300);
  }, [busca, participantes]);

  async function adicionar(cliente: ClienteResult) {
    setAdicionando(cliente.id);
    const supabase = createClient();
    await supabase.from("participacoes").insert({
      cliente_id:  cliente.id,
      viagem_id:   viagemId,
      data_viagem: viagemDataSaida ?? null,
    });
    setBusca("");
    setResultados([]);
    setAdicionando(null);
    carregar();
  }

  async function remover(participacaoId: string) {
    const supabase = createClient();
    await supabase.from("participacoes").delete().eq("id", participacaoId);
    setParticipantes(p => p.filter(x => x.id !== participacaoId));
  }

  function abrirEditarValor(p: Participante) {
    setEditandoValor(p.id);
    setValorTemp(p.valor != null ? String(p.valor).replace(".", ",") : "");
  }

  async function salvarValor(participacaoId: string) {
    const valor = parseFloat(valorTemp.replace(",", ".")) || null;
    const supabase = createClient();
    await supabase.from("participacoes").update({ valor }).eq("id", participacaoId);
    setParticipantes(ps => ps.map(p => p.id === participacaoId ? { ...p, valor } : p));
    setEditandoValor(null);
  }

  const ltv = participantes.reduce((sum, p) => sum + (p.valor ?? 0), 0);

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900">Passageiros</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {participantes.length} cliente{participantes.length !== 1 ? "s" : ""} registrado{participantes.length !== 1 ? "s" : ""}
          {ltv > 0 && ` · ${ltv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em receita`}
        </p>
      </div>

      {/* Campo de busca para adicionar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className="input pl-9"
          placeholder="Buscar cliente por nome ou WhatsApp para adicionar…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onBlur={() => setTimeout(() => setResultados([]), 200)}
        />

        {(resultados.length > 0 || buscando) && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {buscando ? (
              <div className="px-4 py-3 text-sm text-gray-400">Buscando…</div>
            ) : resultados.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">Nenhum cliente encontrado.</div>
            ) : resultados.map(c => (
              <button
                key={c.id}
                onMouseDown={() => adicionar(c)}
                disabled={!!adicionando}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">{c.nome}</div>
                  <div className="text-xs text-gray-400">
                    {c.whatsapp}{c.cidade ? ` · ${c.cidade}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-primary opacity-0 group-hover:opacity-100 shrink-0">
                  <UserPlus className="w-3.5 h-3.5" />
                  {adicionando === c.id ? "Adicionando…" : "Adicionar"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de passageiros */}
      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Carregando…</div>
      ) : participantes.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          Nenhum passageiro registrado. Busque um cliente acima para adicionar.
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {participantes.map(p => (
            <li key={p.id} className="flex items-center justify-between py-2.5 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-primary text-xs font-bold">
                    {p.clientes?.nome.charAt(0) ?? "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {p.clientes?.nome ?? "Cliente removido"}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    {p.clientes?.whatsapp && (
                      <a
                        href={`https://wa.me/${p.clientes.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-green-600"
                      >
                        <MessageSquare className="w-3 h-3" />{p.clientes.whatsapp}
                      </a>
                    )}
                    {p.clientes?.cidade && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{p.clientes.cidade}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editandoValor === p.id ? (
                  <input
                    autoFocus
                    className="input py-1 px-2 text-xs w-28 text-right"
                    placeholder="0,00"
                    value={valorTemp}
                    onChange={e => setValorTemp(e.target.value)}
                    onBlur={() => salvarValor(p.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter") salvarValor(p.id);
                      if (e.key === "Escape") setEditandoValor(null);
                    }}
                  />
                ) : (
                  <button
                    onClick={() => abrirEditarValor(p)}
                    title="Clique para informar o valor pago"
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      p.valor != null && p.valor > 0
                        ? "font-semibold text-green-700 hover:bg-green-50"
                        : "text-gray-300 hover:text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {p.valor != null && p.valor > 0
                      ? p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "+ valor"}
                  </button>
                )}
                <button
                  onClick={() => remover(p.id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remover passageiro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
