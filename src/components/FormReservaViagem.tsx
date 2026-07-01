"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

const WHATSAPP_NUMBER = "5521985131616";

interface Props {
  viagem_id: string;
  titulo: string;
  destino: string;
}

export default function FormReservaViagem({ viagem_id, titulo, destino }: Props) {
  const [nome, setNome]       = useState("");
  const [wa, setWa]           = useState("");
  const [cidade, setCidade]   = useState("");
  const [qtd, setQtd]         = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !wa.trim()) {
      setErro("Nome e WhatsApp são obrigatórios.");
      return;
    }
    setLoading(true);
    setErro("");

    try {
      const supabase = getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("leads").insert({
        nome:              nome.trim(),
        whatsapp:          wa.trim().replace(/\D/g, ""),
        cidade:            cidade.trim() || null,
        viagem_id,
        quantidade_pessoas: qtd,
        mensagem:          `Interesse em reservar ${qtd} vaga(s) para ${titulo}`,
        origem:            "site",
        status:            "novo",
      });
    } catch {
      // Não bloquear o redirecionamento se salvar falhar
    }

    const msg = `Olá, Lisa! Me chamo ${nome.trim()} e quero reservar ${qtd} vaga(s) para *${titulo}*. Pode me ajudar?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setLoading(false);
  }

  function fmtWa(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Seu nome *</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition"
            placeholder="Maria Silva"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">WhatsApp *</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition"
            placeholder="(21) 99999-9999"
            value={wa}
            onChange={e => setWa(fmtWa(e.target.value))}
            inputMode="tel"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Cidade</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition"
            placeholder="Rio de Janeiro"
            value={cidade}
            onChange={e => setCidade(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Nº de pessoas</label>
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5">
            <button type="button" onClick={() => setQtd(q => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-brand-text transition-colors">−</button>
            <span className="flex-1 text-center font-semibold text-brand-text">{qtd}</span>
            <button type="button" onClick={() => setQtd(q => Math.min(20, q + 1))}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-brand-text transition-colors">+</button>
          </div>
        </div>
      </div>

      {erro && <p className="text-red-500 text-sm">{erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        {loading ? "Enviando…" : "Reservar minha vaga no WhatsApp"}
      </button>
      <p className="text-center text-xs text-gray-400">
        Seus dados são usados apenas pela Lisa para confirmar a reserva.
      </p>
    </form>
  );
}
