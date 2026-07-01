"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

type FormState = "idle" | "loading" | "success" | "error";

function formatWhatsApp(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export default function ListaVipForm() {
  const [state, setState] = useState<FormState>("idle");
  const [form, setForm] = useState({ nome: "", whatsapp: "", cidade: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "whatsapp" ? formatWhatsApp(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (getSupabase() as any).from("lista_vip").insert({
        nome: form.nome.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        cidade: form.cidade.trim() || null,
      });
      if (error) throw error;
      if (typeof window !== "undefined" && window.fbq) {
        console.log("Meta Lead disparado");
        window.fbq("track", "Lead");
      }
      setState("success");
    } catch {
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="bg-brand-light rounded-3xl p-8 border border-brand-primary/20 text-center">
        <div className="text-5xl mb-5">🎉</div>
        <h3 className="font-serif text-2xl text-brand-text mb-3">
          Você está na Lista VIP!
        </h3>
        <p className="text-brand-muted leading-relaxed">
          {form.nome.trim().split(" ")[0]}, bem-vinda à Lista VIP da Amo Viajar.{" "}
          Em breve você vai receber as melhores viagens antes de todo mundo.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3.5 text-brand-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition text-base";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="nome" className="block text-sm font-semibold text-brand-text mb-2">
          Seu nome <span className="text-brand-primary">*</span>
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          autoComplete="name"
          placeholder="Como gosta de ser chamada?"
          value={form.nome}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className="block text-sm font-semibold text-brand-text mb-2">
          Seu WhatsApp <span className="text-brand-primary">*</span>
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          required
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={form.whatsapp}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="cidade" className="block text-sm font-semibold text-brand-text mb-2">
          Sua cidade{" "}
          <span className="text-gray-400 text-xs font-normal">(opcional)</span>
        </label>
        <input
          id="cidade"
          name="cidade"
          type="text"
          autoComplete="address-level2"
          placeholder="Ex: Rio de Janeiro, RJ"
          value={form.cidade}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {state === "error" && (
        <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-3 px-4">
          Algo deu errado. Tente novamente ou entre em contato pelo WhatsApp.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="btn-primary w-full justify-center mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Entrando para a lista…" : "Entrar para a Lista VIP →"}
      </button>

      <p className="text-xs text-brand-muted text-center leading-relaxed">
        Seus dados são confidenciais. Prometemos não enviar spam —{" "}
        só o que realmente vale a pena.
      </p>
    </form>
  );
}
