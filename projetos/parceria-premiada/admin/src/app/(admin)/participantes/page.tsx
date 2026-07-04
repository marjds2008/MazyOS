"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCheck, Search, Download, Hash, Shield, ChevronRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Participante {
  id:                 string;
  nome:               string;
  telefone:           string;
  email:              string | null;
  pontos:             number;
  status:             string;
  created_at:         string;
  sequence_number:    number | null;
  display_number:     number | null;
  display_number_fmt: string | null;
  display_hash:       string | null;
  origem:             string | null;
}

// ── Modal de detalhes ─────────────────────────────────────────

function ParticipanteModal({ p, onClose }: { p: Participante; onClose: () => void }) {
  const fmt = p.display_number_fmt ?? (p.sequence_number ? String(p.sequence_number).padStart(5, "0") : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{p.nome}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {fmt && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider mb-1">
                Número da sorte
              </p>
              <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
                PP-{fmt}
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <Row label="Telefone" value={p.telefone} />
            {p.email && <Row label="E-mail" value={p.email} />}
            <Row label="Status" value={p.status} />
            <Row label="Origem" value={p.origem ?? "—"} />
            <Row label="Cadastro" value={new Date(p.created_at).toLocaleString("pt-BR")} />
            {p.sequence_number != null && (
              <Row label="Sequência interna" value={`#${p.sequence_number}`} mono />
            )}
            {p.display_number != null && (
              <Row label="Número da sorte (int)" value={p.display_number.toString()} mono />
            )}
          </div>

          {p.display_hash && (
            <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hash de auditoria
                </span>
              </div>
              <code className="text-[9px] font-mono text-green-600 dark:text-green-400 break-all leading-relaxed">
                {p.display_hash}
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className={`text-gray-900 dark:text-white text-right truncate ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ── Export CSV ────────────────────────────────────────────────

function exportCSV(participantes: Participante[]) {
  const headers = [
    "Nome", "Telefone", "Email", "Status", "Origem",
    "sequence_number", "display_number", "display_number_fmt", "display_hash",
    "engine_version", "Cadastro"
  ];
  const rows = participantes.map(p => [
    `"${p.nome}"`,
    p.telefone,
    p.email ?? "",
    p.status,
    p.origem ?? "",
    p.sequence_number ?? "",
    p.display_number ?? "",
    p.display_number_fmt ? `PP-${p.display_number_fmt}` : "",
    p.display_hash ?? "",
    p.display_hash ? "v1" : "",
    new Date(p.created_at).toLocaleString("pt-BR"),
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `participantes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Status badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const active = status === "ativo" || status === "active" || status === "pending" || status === "validated";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      active
        ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
        : "bg-gray-100 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400"
    }`}>
      {status}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function ParticipantesPage() {
  const supabase = createClient();

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [error,         setError]         = useState<string | null>(null);
  const [selected,      setSelected]      = useState<Participante | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("list_pp_participantes", {
      p_search: search || null,
      p_limit:  200,
    });
    if (error) setError(error.message);
    else setParticipantes((data as Participante[]) ?? []);
    setLoading(false);
  }, [search, supabase]);

  useEffect(() => { load(); }, [load]);

  const comNumero  = participantes.filter(p => p.display_number != null).length;
  const semNumero  = participantes.length - comNumero;

  return (
    <>
      {selected && <ParticipanteModal p={selected} onClose={() => setSelected(null)} />}

      <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Participantes</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {participantes.length} cadastrados
              {comNumero > 0 && (
                <> · <span className="text-amber-600 dark:text-amber-400 font-medium">{comNumero} com número</span></>
              )}
              {semNumero > 0 && (
                <> · <span className="text-gray-400">{semNumero} sem número</span></>
              )}
            </p>
          </div>
          <button
            onClick={() => exportCSV(participantes)}
            disabled={participantes.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nome, telefone ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="card p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : participantes.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <UserCheck className="w-10 h-10 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum participante encontrado</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <span>Participante</span>
              <span>Contato</span>
              <span className="text-center">Nº Sorte</span>
              <span>Status</span>
              <span></span>
            </div>
            {participantes.map(p => {
              const fmt = p.display_number_fmt;
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {/* Nome */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        {p.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.nome}</p>
                      {p.origem && (
                        <span className="text-[10px] text-gray-400">{p.origem}</span>
                      )}
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 min-w-0">
                    <div>{p.telefone}</div>
                    {p.email && <div className="text-xs truncate">{p.email}</div>}
                  </div>

                  {/* Número da sorte */}
                  <div className="text-center">
                    {fmt ? (
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-amber-500" />
                        <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                          PP-{fmt}
                        </span>
                        {p.display_hash && (
                          <Shield className="w-3 h-3 text-green-500 shrink-0" />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <StatusBadge status={p.status} />

                  {/* Detalhes */}
                  <button
                    onClick={() => setSelected(p)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
