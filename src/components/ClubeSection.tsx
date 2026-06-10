"use client";

import { useState, FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

const beneficios = [
  "Vagas com prioridade antes da abertura geral",
  "Novidades e destinos em primeira mão",
  "Descontos exclusivos para membros da família",
  "Grupo VIP no WhatsApp com a Lisa",
  "Convites para encontros e cafés presenciais",
  "Celebração do seu aniversário com a comunidade",
];

export default function ClubeSection() {
  const [form, setForm] = useState({ nome: "", whatsapp: "", cidade: "" });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabase() as any).from("lista_vip").insert({
      nome: form.nome,
      whatsapp: form.whatsapp.replace(/\D/g, ""),
      cidade: form.cidade,
      origem: "site",
    });
    if (error) {
      setErro("Erro ao salvar. Tente novamente ou entre em contato pelo WhatsApp.");
      setLoading(false);
      return;
    }
    setEnviado(true);
    setLoading(false);
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <section id="clube" className="py-20 md:py-28 bg-brand-warm">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Esquerda — Texto */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full px-4 py-2 text-brand-primary text-sm font-semibold mb-6">
              ❤️ Família Amo Viajar
            </div>

            <h2 className="section-title mb-4">
              Junte-se à{" "}
              <span className="italic text-brand-primary">Família Amo Viajar</span>
            </h2>

            <p className="section-subtitle mb-8">
              Entre para uma comunidade de pessoas apaixonadas por viajar, conhecer
              lugares incríveis e criar novas amizades. Aqui, você não é um cliente.
              Você é família.
            </p>

            <ul className="space-y-3">
              {beneficios.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-brand-text text-sm">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
              <p className="text-brand-muted text-sm">
                <span className="font-semibold text-brand-primary">100% gratuito.</span>{" "}
                Sem spam, sem cobranças. Você recebe só o que importa:
                viagens, encontros e novidades da família.
              </p>
            </div>
          </div>

          {/* Direita — Formulário */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            {enviado ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-5">🎉</div>
                <h3 className="font-serif text-2xl font-bold text-brand-text mb-3">
                  Bem-vinda à Família!
                </h3>
                <p className="text-brand-muted leading-relaxed text-sm">
                  A Lisa vai entrar em contato pelo WhatsApp para te receber
                  com muito carinho. Fique de olho — logo você recebe as primeiras novidades.
                </p>
                <div className="mt-6 p-4 bg-brand-warm rounded-2xl text-sm text-brand-muted italic">
                  "Cada pessoa que entra para a família é uma nova história que começa." — Lisa
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="font-serif text-2xl font-bold text-brand-text mb-2">
                    Entrar para a Família
                  </h3>
                  <p className="text-brand-muted text-sm">
                    Preencha abaixo e faça parte da Família Amo Viajar.
                    A Lisa vai te dar as boas-vindas pessoalmente.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="nome" className="block text-brand-text font-medium text-sm mb-2">
                      Seu nome completo
                    </label>
                    <input
                      id="nome"
                      type="text"
                      required
                      placeholder="Ex.: Maria das Graças"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-brand-text placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition text-base"
                    />
                  </div>

                  <div>
                    <label htmlFor="whatsapp" className="block text-brand-text font-medium text-sm mb-2">
                      WhatsApp
                    </label>
                    <input
                      id="whatsapp"
                      type="tel"
                      required
                      placeholder="(21) 99999-9999"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: formatWhatsApp(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-brand-text placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition text-base"
                    />
                  </div>

                  <div>
                    <label htmlFor="cidade" className="block text-brand-text font-medium text-sm mb-2">
                      Sua cidade
                    </label>
                    <input
                      id="cidade"
                      type="text"
                      required
                      placeholder="Ex.: Rio de Janeiro"
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-brand-text placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition text-base"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      "Entrar para a Família ❤️"
                    )}
                  </button>

                  {erro && <p className="text-red-600 text-xs text-center">{erro}</p>}
                  <p className="text-gray-400 text-xs text-center">
                    Seus dados são protegidos. Nunca compartilhamos com terceiros.
                  </p>
                </form>
              </>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
