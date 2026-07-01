"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, MessageSquare, ExternalLink, UserX, UserCheck, Plus, Pencil, Upload } from "lucide-react";
import ClienteForm from "@/components/ClienteForm";
import ClienteDetalhe from "@/components/ClienteDetalhe";
import ImportarClientesModal from "@/components/ImportarClientesModal";
import type { Cliente } from "@/types/database";

const ORIGENS: Record<string, string> = {
  site:       "Site",
  lista_vip:  "Lista VIP",
  lead:       "Lead",
  manual:     "Manual",
  importacao: "Importação",
};

const CATEGORIAS: Record<string, string> = {
  serra:       "Serra",
  praia:       "Praia",
  cultura:     "Cultura",
  fe:          "Fé",
  interior_rj: "Interior RJ",
};

export default function ClientesPage() {
  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [busca, setBusca]             = useState("");
  const [filtroOptOut, setFiltroOptOut] = useState<"todos" | "ativos" | "opt_out">("ativos");
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<"novo" | Cliente | null>(null);
  const [detalhe, setDetalhe]         = useState<Cliente | null>(null);
  const [importar, setImportar]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("clientes").select("*").order("criado_em", { ascending: false });
    if (filtroOptOut === "ativos")  q = q.eq("opt_out", false);
    if (filtroOptOut === "opt_out") q = q.eq("opt_out", true);
    const { data } = await q;
    setClientes(data ?? []);
    setLoading(false);
  }, [filtroOptOut]);

  useEffect(() => { load(); }, [load]);

  const filtrados = clientes.filter(c =>
    !busca ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca) ||
    (c.cidade ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  async function toggleOptOut(id: string, atual: boolean) {
    const supabase = createClient();
    await supabase.from("clientes").update({ opt_out: !atual }).eq("id", id);
    setClientes(prev => prev.map(c => c.id === id ? { ...c, opt_out: !atual } : c));
  }

  function waLink(phone: string, nome: string) {
    const msg = encodeURIComponent(`Olá ${nome}! Aqui é a Lisa da Amo Viajar ❤️`);
    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;
  }

  function fmtTs(ts: string) {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  const stats = {
    total:   clientes.length,
    ativos:  clientes.filter(c => !c.opt_out && c.aceitou_receber_mensagens).length,
    opt_out: clientes.filter(c => c.opt_out).length,
    novos30: clientes.filter(c => new Date(c.criado_em) > new Date(Date.now() - 30 * 86400000)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">CRM de contatos da Amo Viajar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportar(true)} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Importar CSV
          </button>
          <button onClick={() => setModal("novo")} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo cliente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",           value: stats.total,   color: "text-gray-900" },
          { label: "Podem receber",   value: stats.ativos,  color: "text-green-700" },
          { label: "Opt-out",         value: stats.opt_out, color: "text-red-600" },
          { label: "Últimos 30 dias", value: stats.novos30, color: "text-brand-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, WhatsApp ou cidade…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "ativos", "opt_out"] as const).map(f => (
            <button key={f} onClick={() => setFiltroOptOut(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                filtroOptOut === f ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {f === "todos" ? "Todos" : f === "ativos" ? "Podem receber" : "Opt-out"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
        ) : !filtrados.length ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {busca ? `Nenhum resultado para "${busca}".` : "Nenhum cliente encontrado."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nome", "WhatsApp", "Cidade", "Categoria", "Origem", "Cadastro", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.opt_out ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-brand-primary text-xs font-bold">{c.nome.charAt(0)}</span>
                        </div>
                        <div>
                          <button onClick={() => setDetalhe(c)} className="font-medium text-gray-900 hover:text-brand-primary transition-colors text-left">{c.nome}</button>
                          {c.data_nascimento && (
                            <div className="text-xs text-gray-400">
                              {new Date(c.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={waLink(c.whatsapp, c.nome)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-green-600 font-medium hover:text-green-700">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {c.whatsapp}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.cidade || "—"}</td>
                    <td className="px-4 py-3">
                      {c.categoria_favorita ? (
                        <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-medium">
                          {CATEGORIAS[c.categoria_favorita] ?? c.categoria_favorita}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ORIGENS[c.origem] ?? c.origem}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtTs(c.criado_em)}</td>
                    <td className="px-4 py-3">
                      {c.opt_out ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">Opt-out</span>
                      ) : c.aceitou_receber_mensagens ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">Ativo</span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-500">Sem aceite</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(c)} title="Editar"
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleOptOut(c.id, c.opt_out)}
                          title={c.opt_out ? "Remover opt-out" : "Marcar opt-out"}
                          className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${c.opt_out ? "text-green-500" : "text-red-400"}`}>
                          {c.opt_out ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ClienteForm
          cliente={modal === "novo" ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {detalhe && (
        <ClienteDetalhe
          cliente={detalhe}
          onClose={() => setDetalhe(null)}
          onEditar={() => { setModal(detalhe); setDetalhe(null); }}
        />
      )}

      {importar && (
        <ImportarClientesModal
          onClose={() => setImportar(false)}
          onSaved={() => { setImportar(false); load(); }}
        />
      )}
    </div>
  );
}
