"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, MessageSquare, ExternalLink, Copy, Check, Download, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  whatsapp: string;
  instagram: string;
  city: string | null;
  state: string | null;
  status: string;
  lucky_number: number | null;
  campaign_id: string;
  campaign_slug: string;
  campaign_title: string;
  created_at: string;
  total_count: number;
}

interface Campaign { id: string; slug: string; title: string; }

const STATUS_LABEL: Record<string, string> = {
  pending:   "Pendente",
  validated: "Validado",
  winner:    "Vencedor",
  cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  validated: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  winner:    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

const PAGE_SIZE = 50;

function fmtLucky(n: number | null) {
  if (!n) return "—";
  return "PP-" + String(n).padStart(6, "0");
}
function fmtTs(ts: string) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function waLink(phone: string, name: string) {
  const msg = encodeURIComponent(`Olá ${name}! Aqui é a equipe da Parceria Premiada 🎉`);
  return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${msg}`;
}

export default function PPParticipantesPage() {
  const [rows, setRows]               = useState<Participant[]>([]);
  const [campanhas, setCampanhas]     = useState<Campaign[]>([]);
  const [busca, setBusca]             = useState("");
  const [campanha, setCampanha]       = useState("");
  const [pagina, setPagina]           = useState(0);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Participant | null>(null);
  const [copied, setCopied]           = useState<string | null>(null);

  // Carregar campanhas para o filtro
  useEffect(() => {
    createClient()
      .from("campaigns")
      .select("id, slug, title")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCampanhas(data ?? []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("admin_list_participants", {
      p_campaign_id: campanha || null,
      p_search:      busca || null,
      p_limit:       PAGE_SIZE,
      p_offset:      pagina * PAGE_SIZE,
    });
    const list = (data as Participant[]) ?? [];
    setRows(list);
    setTotal(list[0]?.total_count ?? 0);
    setLoading(false);
  }, [busca, campanha, pagina]);

  useEffect(() => { load(); }, [load]);

  // Reset página ao mudar filtros
  useEffect(() => { setPagina(0); }, [busca, campanha]);

  function copyNum(n: number | null) {
    if (!n) return;
    navigator.clipboard.writeText(fmtLucky(n));
    setCopied("num");
    setTimeout(() => setCopied(null), 1500);
  }

  function exportCSV() {
    const header = ["Nome", "WhatsApp", "Instagram", "Cidade", "Estado", "Status", "Número da sorte", "Campanha", "Cadastrado em"];
    const csvRows = rows.map(r => [
      r.name, r.whatsapp, r.instagram, r.city ?? "", r.state ?? "",
      STATUS_LABEL[r.status] ?? r.status, fmtLucky(r.lucky_number),
      r.campaign_slug, fmtTs(r.created_at),
    ]);
    const csv = [header, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "participantes-pp.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Participantes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} cadastros</p>
        </div>
        <button onClick={exportCSV} className="btn-primary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, WhatsApp ou Instagram…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>
        <select
          value={campanha}
          onChange={e => setCampanha(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="">Todas as campanhas</option>
          {campanhas.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
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
                  {["Nome", "Número", "Status", "WhatsApp", "Instagram", "Cidade", "Campanha", "Cadastrado", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {!rows.length && (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">Nenhum participante encontrado.</td></tr>
                )}
                {rows.map(r => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">{fmtLucky(r.lucky_number)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] ?? ""}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-500">@{r.instagram}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{[r.city, r.state].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.campaign_slug}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtTs(r.created_at)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <a href={waLink(r.whatsapp, r.name)} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-500/10 text-green-600 transition-colors" title="Abrir WhatsApp">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <a href={`https://instagram.com/${r.instagram}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-pink-50 dark:hover:bg-pink-500/10 text-pink-500 transition-colors" title="Ver Instagram">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
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

      {/* Modal de detalhe */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selected.campaign_title}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Número da sorte */}
            <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-500 font-semibold uppercase tracking-wide">Número da sorte</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 font-mono mt-1">{fmtLucky(selected.lucky_number)}</p>
              </div>
              <button
                onClick={() => copyNum(selected.lucky_number)}
                className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 transition-colors"
                title="Copiar número"
              >
                {copied === "num" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[selected.status] ?? ""}`}>
                {STATUS_LABEL[selected.status] ?? selected.status}
              </span>
            </div>

            {/* Dados */}
            <div className="space-y-2 text-sm">
              {[
                { label: "WhatsApp",  value: selected.whatsapp },
                { label: "Instagram", value: "@" + selected.instagram },
                { label: "Cidade",    value: [selected.city, selected.state].filter(Boolean).join(" — ") || "—" },
                { label: "Cadastro",  value: fmtTs(selected.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <a href={waLink(selected.whatsapp, selected.name)} target="_blank" rel="noopener noreferrer"
                className="flex-1 btn-primary text-center text-sm flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>
              <a href={`https://instagram.com/${selected.instagram}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-4 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> Instagram
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
