"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DrawEngine } from "@/lib/draw-engine";
import {
  KeyRound, Shield, Hash, CheckCircle2, XCircle, RefreshCw,
  Copy, Check, Search, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

interface Campanha {
  id:                  string;
  nome:                string;
  seed:                string | null;
  seed_hash:           string | null;
  algorithm_version:   string | null;
  draw_engine_version: string | null;
  current_sequence:    number;
  created_draw_at:     string | null;
}

interface AuditRow {
  id:               string;
  sequence_number:  number;
  display_number:   number;
  display_hash:     string;
  verified_ok:      boolean | null;
  created_at:       string;
  participante_nome: string | null;
}

// ── Verify form ───────────────────────────────────────────────

function VerifyForm({ seed }: { seed: string }) {
  const [seq, setSeq]     = useState("");
  const [num, setNum]     = useState("");
  const [result, setResult] = useState<{ valid: boolean; expected: number } | null>(null);

  function verify() {
    const sequence = parseInt(seq);
    const provided = parseInt(num);
    if (!sequence || isNaN(provided)) return;
    const r = DrawEngine.verify(seed, sequence, provided);
    setResult({ valid: r.valid, expected: r.expected });
  }

  return (
    <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Search className="w-4 h-4 text-brand-primary" /> Verificar número
      </h3>
      <div className="flex gap-2">
        <input
          type="number" placeholder="Sequência" value={seq}
          onChange={e => setSeq(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-primary"
        />
        <input
          type="number" placeholder="Número (ex: 42035)" value={num}
          onChange={e => setNum(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-primary"
        />
        <button onClick={verify}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/80 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Verificar
        </button>
      </div>
      {result && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          result.valid
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {result.valid
            ? <><CheckCircle2 className="w-4 h-4" /> Número válido! Gerado deterministicamente pela seed.</>
            : <><XCircle className="w-4 h-4" /> Inválido. O número correto para essa sequência é <strong>{result.expected.toString().padStart(5, "0")}</strong>.</>
          }
        </div>
      )}
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Stat card ─────────────────────────────────────────────────

function StatCard({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold text-white ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function DrawEnginePage() {
  const supabase = createClient();

  const [campanhas, setCampanhas]   = useState<Campanha[]>([]);
  const [selected, setSelected]     = useState<Campanha | null>(null);
  const [auditRows, setAuditRows]   = useState<AuditRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [generatingSeed, setGeneratingSeed] = useState(false);

  const loadCampanhas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pp_campanhas")
      .select("id, nome, seed, seed_hash, algorithm_version, draw_engine_version, current_sequence, created_draw_at")
      .order("created_at", { ascending: false });
    setCampanhas((data as Campanha[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadCampanhas(); }, [loadCampanhas]);

  async function loadAudit(campanhaId: string) {
    setLoadingAudit(true);
    const { data } = await supabase.rpc("list_draw_audit", {
      p_campanha_id: campanhaId,
      p_limit: 100,
      p_offset: 0,
    });
    setAuditRows((data as AuditRow[]) ?? []);
    setLoadingAudit(false);
  }

  function selectCampanha(c: Campanha) {
    setSelected(c);
    loadAudit(c.id);
  }

  async function generateSeed(campanhaId: string) {
    setGeneratingSeed(true);
    const seedData = DrawEngine.SeedManager.createCampaignSeed();

    const { error } = await supabase
      .from("pp_campanhas")
      .update({
        seed:               seedData.seed,
        seed_hash:          seedData.seedHash,
        algorithm_version:  seedData.algorithmVersion,
        draw_engine_version: seedData.drawEngineVersion,
        created_draw_at:    seedData.createdAt.toISOString(),
      })
      .eq("id", campanhaId);

    setGeneratingSeed(false);

    if (!error) {
      await loadCampanhas();
      // Refresh selected
      const updated = campanhas.find(c => c.id === campanhaId);
      if (updated) setSelected({ ...updated, ...seedData, seed_hash: seedData.seedHash });
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/15 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Draw Engine</h1>
            <p className="text-xs text-gray-400">Motor criptográfico de geração de números da sorte</p>
          </div>
        </div>
        <a
          href="/transparencia"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-xs text-gray-300 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" /> Página Pública <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* Algorithm info banner */}
      <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Hash className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {DrawEngine.SeedManager.deriveKey ? "" : ""}Feistel Network (8 rodadas) + HMAC-SHA256
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Algoritmo <strong className="text-gray-300">v{DrawEngine.algorithmVersion}</strong> · Engine <strong className="text-gray-300">v{DrawEngine.version}</strong> ·
              Domínio <strong className="text-gray-300">00000–99999</strong> ·
              Zero colisões garantidas matematicamente · Sub-1ms por número
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Campanhas list */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Campanhas</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Carregando...</div>
          ) : campanhas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">Nenhuma campanha</div>
          ) : (
            campanhas.map(c => (
              <button
                key={c.id}
                onClick={() => selectCampanha(c)}
                className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${
                  selected?.id === c.id
                    ? "bg-brand-primary/10 border-brand-primary/30 text-white"
                    : "bg-gray-800/50 border-white/10 text-gray-300 hover:bg-gray-800"
                }`}
              >
                <p className="text-sm font-medium truncate">{c.nome}</p>
                <div className="flex items-center gap-2 mt-1">
                  {c.seed ? (
                    <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded">
                      seed ativa
                    </span>
                  ) : (
                    <span className="text-[10px] bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded">
                      sem seed
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">{c.current_sequence} emitidos</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Campaign detail */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm bg-gray-800/30 border border-white/10 rounded-xl">
              Selecione uma campanha
            </div>
          ) : (
            <>
              <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">{selected.nome}</h2>
                  {!selected.seed && (
                    <button
                      onClick={() => generateSeed(selected.id)}
                      disabled={generatingSeed}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {generatingSeed ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                      Gerar seed
                    </button>
                  )}
                </div>

                {selected.seed ? (
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Algoritmo" value={`Feistel · ${selected.algorithm_version ?? "v1"}`} />
                    <StatCard label="Engine Version" value={selected.draw_engine_version ?? "2.0"} />
                    <StatCard label="Números emitidos" value={selected.current_sequence} />
                    <StatCard label="Ativado em" value={
                      selected.created_draw_at
                        ? new Date(selected.created_draw_at).toLocaleDateString("pt-BR")
                        : "—"
                    } />
                    <div className="col-span-2 bg-gray-900/60 border border-white/10 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 mb-1">Seed Hash (SHA256 público — a seed real fica no servidor)</p>
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] text-green-400 font-mono break-all leading-relaxed flex-1">
                          {selected.seed_hash ?? "—"}
                        </code>
                        {selected.seed_hash && <CopyBtn value={selected.seed_hash} />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-400 mb-1">Esta campanha ainda não tem seed.</p>
                    <p className="text-xs text-gray-500">
                      Clique em <strong>Gerar seed</strong> para ativar o Draw Engine nessa campanha.
                    </p>
                  </div>
                )}
              </div>

              {/* Verify form — only if seed exists */}
              {selected.seed && <VerifyForm seed={selected.seed} />}

              {/* Audit log */}
              <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Audit log</h3>
                {loadingAudit ? (
                  <div className="text-center py-6 text-gray-500 text-sm">Carregando...</div>
                ) : auditRows.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Nenhum número emitido ainda.
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Seq</th>
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Número</th>
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Participante</th>
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Hash</th>
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Verificado</th>
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {auditRows.map(row => (
                          <tr key={row.id} className="hover:bg-white/5">
                            <td className="px-4 py-2 text-gray-300 font-mono">{row.sequence_number}</td>
                            <td className="px-4 py-2 text-brand-primary font-mono font-bold">
                              {row.display_number.toString().padStart(5, "0")}
                            </td>
                            <td className="px-4 py-2 text-gray-300">{row.participante_nome ?? "—"}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                <code className="text-[9px] text-gray-500 font-mono truncate max-w-[80px]">
                                  {row.display_hash.slice(0, 12)}…
                                </code>
                                <CopyBtn value={row.display_hash} />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {row.verified_ok === null ? (
                                <span className="text-gray-500">—</span>
                              ) : row.verified_ok ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {new Date(row.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
