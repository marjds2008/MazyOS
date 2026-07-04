"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";

interface VerifyResult {
  valid:             boolean;
  display_hash:      string;
  algorithm_version: string;
  campanha_nome:     string;
  participante_nome: string;
}

export function VerifyWidget() {
  const supabase = createClient();

  const [campaignId, setCampaignId] = useState("");
  const [sequence, setSequence]     = useState("");
  const [number, setNumber]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<VerifyResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  async function verify() {
    if (!campaignId || !sequence || !number) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const { data, error: rpcErr } = await supabase.rpc("verify_participant_number", {
      p_campanha_id:    campaignId,
      p_sequence:       parseInt(sequence),
      p_display_number: parseInt(number),
    });

    setLoading(false);

    if (rpcErr || !data || data.length === 0) {
      setError("Participante não encontrado. Verifique o ID da campanha e a sequência.");
      return;
    }

    setResult(data[0] as VerifyResult);
  }

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">ID da campanha (UUID)</label>
          <input
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 placeholder-gray-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Número de sequência</label>
          <input
            type="number"
            placeholder="Ex: 42"
            value={sequence}
            onChange={e => setSequence(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Número da sorte</label>
          <input
            type="number"
            placeholder="Ex: 42035"
            value={number}
            onChange={e => setNumber(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <button
        onClick={verify}
        disabled={loading || !campaignId || !sequence || !number}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold rounded-xl transition-colors"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
          : <><Search className="w-4 h-4" /> Verificar número</>
        }
      </button>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className={`rounded-xl border p-4 space-y-3 ${
          result.valid
            ? "bg-green-500/5 border-green-500/20"
            : "bg-red-500/5 border-red-500/20"
        }`}>
          <div className="flex items-center gap-2">
            {result.valid
              ? <CheckCircle2 className="w-5 h-5 text-green-400" />
              : <XCircle className="w-5 h-5 text-red-400" />
            }
            <span className={`text-base font-bold ${result.valid ? "text-green-400" : "text-red-400"}`}>
              {result.valid ? "Número válido!" : "Número inválido"}
            </span>
          </div>

          {result.valid && (
            <div className="space-y-2 text-sm">
              {result.campanha_nome && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Campanha</span>
                  <span className="text-white font-medium">{result.campanha_nome}</span>
                </div>
              )}
              {result.participante_nome && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Participante</span>
                  <span className="text-white font-medium">{result.participante_nome}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Algoritmo</span>
                <span className="text-white font-mono">{result.algorithm_version}</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-1">Hash criptográfico</p>
                <code className="text-[10px] text-green-400 font-mono break-all">{result.display_hash}</code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
