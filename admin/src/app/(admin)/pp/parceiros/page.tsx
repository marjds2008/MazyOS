"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Copy, Check } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  instagram: string | null;
  website: string | null;
  category: string | null;
  status: string;
}

interface Campaign { id: string; title: string; }

const STATUS_COLOR: Record<string, string> = {
  active:   "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

export default function PPParceirosPage() {
  const [parceiros, setParceiros] = useState<Partner[]>([]);
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [campanha, setCampanha]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("campaigns")
      .select("id, title")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCampanhas(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    createClient()
      .rpc("admin_list_partners", { p_campaign_id: campanha || null })
      .then(({ data }) => {
        setParceiros((data as Partner[]) ?? []);
        setLoading(false);
      });
  }, [campanha]);

  function copyAt(instagram: string | null) {
    if (!instagram) return;
    navigator.clipboard.writeText("@" + instagram.replace(/^@/, ""));
    setCopied(instagram);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parceiros</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{parceiros.length} parceiros</p>
        </div>
        <select
          value={campanha}
          onChange={e => setCampanha(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="">Todos os parceiros</option>
          {campanhas.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Nome", "Instagram", "Categoria", "Status", "Ações"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {!parceiros.length && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Nenhum parceiro encontrado.</td></tr>
                )}
                {parceiros.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {p.instagram ? `@${p.instagram.replace(/^@/, "")}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.category || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] ?? ""}`}>
                        {p.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {p.instagram && (
                          <a
                            href={`https://instagram.com/${p.instagram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir Instagram"
                            className="p-1.5 rounded hover:bg-pink-50 dark:hover:bg-pink-500/10 text-pink-500 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {p.instagram && (
                          <button
                            onClick={() => copyAt(p.instagram)}
                            title="Copiar @"
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                          >
                            {copied === p.instagram
                              ? <Check className="w-4 h-4 text-green-500" />
                              : <Copy className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
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
