"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Plus, MapPin, Calendar, Trash2, MessageSquare } from "lucide-react";
import type { Cliente, Participacao, Viagem } from "@/types/database";

const CATEGORIAS: Record<string, string> = {
  serra: "Serra", praia: "Praia", cultura: "Cultura",
  fe: "Fé", interior_rj: "Interior RJ",
};

interface Props {
  cliente: Cliente;
  onClose: () => void;
  onEditar: () => void;
}

export default function ClienteDetalhe({ cliente, onClose, onEditar }: Props) {
  const [aba, setAba]                       = useState<"dados" | "historico">("historico");
  const [participacoes, setParticipacoes]   = useState<Participacao[]>([]);
  const [viagens, setViagens]               = useState<Pick<Viagem, "id" | "titulo" | "destino" | "categoria">[]>([]);
  const [loadingHist, setLoadingHist]       = useState(true);
  const [adicionando, setAdicionando]       = useState(false);
  const [salvando, setSalvando]             = useState(false);
  const [nova, setNova]                     = useState({ viagem_id: "", destino: "", data_viagem: "", observacoes: "" });

  const carregarHistorico = useCallback(async () => {
    setLoadingHist(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("participacoes")
      .select("*, viagens(id, titulo, destino, categoria)")
      .eq("cliente_id", cliente.id)
      .order("data_viagem", { ascending: false, nullsFirst: false });
    setParticipacoes((data ?? []) as Participacao[]);
    setLoadingHist(false);
  }, [cliente.id]);

  useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

  useEffect(() => {
    async function carregarViagens() {
      const supabase = createClient();
      const { data } = await supabase
        .from("viagens")
        .select("id, titulo, destino, categoria")
        .order("data_saida", { ascending: false });
      setViagens(data ?? []);
    }
    carregarViagens();
  }, []);

  async function adicionarViagem() {
    if (!nova.viagem_id && !nova.destino.trim()) return;
    setSalvando(true);
    const supabase = createClient();
    const viagem = viagens.find(v => v.id === nova.viagem_id);
    await supabase.from("participacoes").insert({
      cliente_id:  cliente.id,
      viagem_id:   nova.viagem_id || null,
      destino:     nova.viagem_id ? viagem?.destino : nova.destino.trim() || null,
      data_viagem: nova.data_viagem || null,
      observacoes: nova.observacoes.trim() || null,
    });
    setNova({ viagem_id: "", destino: "", data_viagem: "", observacoes: "" });
    setAdicionando(false);
    setSalvando(false);
    carregarHistorico();
  }

  async function remover(id: string) {
    const supabase = createClient();
    await supabase.from("participacoes").delete().eq("id", id);
    setParticipacoes(p => p.filter(x => x.id !== id));
  }

  function fmtData(d?: string) {
    if (!d) return null;
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  }

  function waLink() {
    const msg = encodeURIComponent(`Olá ${cliente.nome}! Aqui é a Lisa da Amo Viajar ❤️`);
    return `https://wa.me/${cliente.whatsapp.replace(/\D/g, "")}?text=${msg}`;
  }

  const categoriaFav = participacoes.length
    ? Object.entries(
        participacoes.reduce((acc, p) => {
          const cat = p.viagens?.categoria ?? "";
          if (cat) acc[cat] = (acc[cat] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <span className="text-brand-primary font-bold">{cliente.nome.charAt(0)}</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{cliente.nome}</div>
              <a href={waLink()} target="_blank" rel="noopener noreferrer"
                className="text-xs text-green-600 flex items-center gap-1 hover:text-green-700">
                <MessageSquare className="w-3 h-3" />{cliente.whatsapp}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEditar} className="btn-secondary text-xs px-3 py-1.5">Editar</button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100 shrink-0">
          {(["historico", "dados"] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                aba === a ? "border-brand-primary text-brand-primary" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {a === "historico" ? `Histórico (${participacoes.length})` : "Dados"}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 px-6 py-4">

          {aba === "dados" && (
            <dl className="space-y-3 text-sm">
              {[
                { label: "Cidade", value: cliente.cidade },
                { label: "Data de nascimento", value: cliente.data_nascimento ? new Date(cliente.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR") : null },
                { label: "Categoria favorita", value: cliente.categoria_favorita ? CATEGORIAS[cliente.categoria_favorita] : null },
                { label: "Origem", value: cliente.origem },
                { label: "Observações", value: cliente.observacoes },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex gap-3">
                  <dt className="text-gray-400 w-36 shrink-0">{label}</dt>
                  <dd className="text-gray-800">{value}</dd>
                </div>
              ) : null)}
            </dl>
          )}

          {aba === "historico" && (
            <div className="space-y-4">
              {/* Resumo */}
              {participacoes.length > 0 && (
                <div className="flex gap-4 text-sm">
                  <div className="card px-4 py-3 text-center flex-1">
                    <div className="text-xl font-bold text-brand-primary">{participacoes.length}</div>
                    <div className="text-xs text-gray-500">viagens</div>
                  </div>
                  {categoriaFav && (
                    <div className="card px-4 py-3 text-center flex-1">
                      <div className="text-sm font-bold text-gray-700">{CATEGORIAS[categoriaFav] ?? categoriaFav}</div>
                      <div className="text-xs text-gray-500">categoria favorita</div>
                    </div>
                  )}
                </div>
              )}

              {/* Lista */}
              {loadingHist ? (
                <div className="py-8 text-center text-gray-400 text-sm">Carregando…</div>
              ) : participacoes.length === 0 && !adicionando ? (
                <div className="py-8 text-center text-gray-400 text-sm">Nenhuma viagem registrada ainda.</div>
              ) : (
                <ul className="space-y-2">
                  {participacoes.map(p => (
                    <li key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MapPin className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800 text-sm truncate">
                            {p.viagens?.titulo ?? p.destino ?? "Viagem"}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {p.viagens?.categoria && (
                              <span className="text-xs bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-full">
                                {CATEGORIAS[p.viagens.categoria] ?? p.viagens.categoria}
                              </span>
                            )}
                            {p.data_viagem && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{fmtData(p.data_viagem)}
                              </span>
                            )}
                          </div>
                          {p.observacoes && <p className="text-xs text-gray-500 mt-1">{p.observacoes}</p>}
                        </div>
                      </div>
                      <button onClick={() => remover(p.id)} className="p-1 rounded hover:bg-gray-200 text-gray-300 hover:text-red-400 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Formulário adicionar */}
              {adicionando ? (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="label">Viagem cadastrada</label>
                    <select className="input" value={nova.viagem_id} onChange={e => setNova(n => ({ ...n, viagem_id: e.target.value, destino: "" }))}>
                      <option value="">Selecionar viagem…</option>
                      {viagens.map(v => <option key={v.id} value={v.id}>{v.titulo} — {v.destino}</option>)}
                    </select>
                  </div>
                  {!nova.viagem_id && (
                    <div>
                      <label className="label">Ou destino manual</label>
                      <input className="input" placeholder="ex: Penedo" value={nova.destino} onChange={e => setNova(n => ({ ...n, destino: e.target.value }))} />
                    </div>
                  )}
                  <div>
                    <label className="label">Data da viagem</label>
                    <input className="input" type="date" value={nova.data_viagem} onChange={e => setNova(n => ({ ...n, data_viagem: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Observações</label>
                    <input className="input" placeholder="Opcional…" value={nova.observacoes} onChange={e => setNova(n => ({ ...n, observacoes: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setAdicionando(false)} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
                    <button onClick={adicionarViagem} disabled={salvando || (!nova.viagem_id && !nova.destino.trim())} className="btn-primary text-xs px-3 py-1.5">
                      {salvando ? "Salvando…" : "Registrar"}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAdicionando(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-primary hover:text-brand-primary transition-colors text-sm">
                  <Plus className="w-4 h-4" /> Registrar viagem
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
