"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { X } from "lucide-react";

const WHATSAPP_NUMBER = "5521985131616";

interface Props {
  destino: string;
  estado: string;
  onClose: () => void;
}

export default function ModalLead({ destino, estado, onClose }: Props) {
  const [nome, setNome]       = useState("");
  const [whatsapp, setWa]     = useState("");
  const [cidade, setCidade]   = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro]       = useState("");

  async function enviar() {
    if (!nome.trim() || !whatsapp.trim()) {
      setErro("Nome e WhatsApp são obrigatórios.");
      return;
    }
    setEnviando(true);
    setErro("");

    try {
      const supabase = getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("leads").insert({
        nome:     nome.trim(),
        whatsapp: whatsapp.trim().replace(/\D/g, ""),
        cidade:   cidade.trim() || null,
        mensagem: `Interesse em viajar para ${destino} (${estado})`,
        origem:   "site",
        status:   "novo",
      });
    } catch {
      // Não bloquear o redirecionamento se salvar falhar
    }

    const msg = `Olá, Lisa! Me chamo ${nome.trim()} e tenho interesse em viajar para ${destino}. Pode me contar sobre a próxima data?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-brand-primary px-6 py-5 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">Você escolheu</p>
          <h3 className="text-xl font-bold font-serif">{destino} · {estado}</h3>
          <p className="text-white/80 text-sm mt-1">Me conta quem você é para a Lisa entrar em contato</p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition"
              placeholder="Maria Silva"
              value={nome}
              onChange={e => setNome(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu WhatsApp *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition"
              placeholder="21 99999-9999"
              value={whatsapp}
              onChange={e => setWa(e.target.value)}
              inputMode="tel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition"
              placeholder="Rio de Janeiro"
              value={cidade}
              onChange={e => setCidade(e.target.value)}
            />
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          <button
            onClick={enviar}
            disabled={enviando}
            className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2.5 transition-colors text-sm active:scale-95"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {enviando ? "Enviando…" : "Falar com a Lisa no WhatsApp"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Seus dados são usados apenas pela Lisa para entrar em contato.
          </p>
        </div>
      </div>
    </div>
  );
}
