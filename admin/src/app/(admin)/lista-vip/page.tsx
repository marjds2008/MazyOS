"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, ExternalLink, Search } from "lucide-react";
import type { ListaVip } from "@/types/database";

export default function ListaVipPage() {
  const [lista, setLista] = useState<ListaVip[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.from("lista_vip").select("*").order("criado_em", { ascending: false });
      setLista(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtrados = lista.filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.whatsapp.includes(busca) || (p.cidade ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  function waLink(phone: string, nome: string) {
    const msg = encodeURIComponent(`Olá ${nome}! Você está na nossa Lista VIP da Amo Viajar. Tenho uma novidade especial para você! 🎉`);
    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;
  }

  function fmtTs(ts: string) {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  function waBroadcast() {
    alert(`${filtrados.length} contatos na lista${busca ? ` (filtrado: "${busca}")` : ""}.\n\nPara envio em massa, use o WhatsApp Business — exporte esta lista ou entre em contato com cada um individualmente.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista VIP</h1>
          <p className="text-gray-500 text-sm mt-1">{lista.length} pessoa{lista.length !== 1 ? "s" : ""} na família VIP</p>
        </div>
        <button onClick={waBroadcast} className="btn-primary">
          <MessageSquare className="w-4 h-4" /> Enviar para lista
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, WhatsApp ou cidade…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total VIP",         value: lista.length },
          { label: "Resultados",        value: filtrados.length },
          { label: "Com cidade",        value: lista.filter(p => p.cidade).length },
          { label: "Últimos 30 dias",   value: lista.filter(p => new Date(p.criado_em) > new Date(Date.now() - 30 * 86400000)).length },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
        ) : !filtrados.length ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {busca ? `Nenhum resultado para "${busca}".` : "Nenhum membro na lista VIP."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nome", "WhatsApp", "Cidade", "Entrou em", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-brand-primary text-xs font-bold">{p.nome.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={waLink(p.whatsapp, p.nome)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-green-600 font-medium hover:text-green-700">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {p.whatsapp}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.cidade || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtTs(p.criado_em)}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={waLink(p.whatsapp, p.nome)} target="_blank" rel="noopener noreferrer"
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
