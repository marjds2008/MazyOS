"use client";

import { useState } from "react";
import ViagensDoBancoCards from "@/components/ViagensDoBancoCards";

type Categoria = "todos" | "praia" | "serra" | "cultura" | "fe";

const FILTROS: { valor: Categoria; label: string; emoji: string }[] = [
  { valor: "todos",   label: "Todas",   emoji: "🗺️" },
  { valor: "praia",   label: "Praia",   emoji: "🏖️" },
  { valor: "serra",   label: "Serra",   emoji: "🏔️" },
  { valor: "fe",      label: "Fé",      emoji: "✨" },
  { valor: "cultura", label: "Cultura", emoji: "🏛️" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ViagemFiltros({ viagens }: { viagens: any[] }) {
  const [cat, setCat] = useState<Categoria>("todos");

  const filtradas = cat === "todos"
    ? viagens
    : viagens.filter((v) => v.categoria === cat);

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setCat(f.valor)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              cat === f.valor
                ? "bg-brand-primary text-white shadow-sm"
                : "bg-white border border-gray-200 text-brand-text hover:border-brand-primary hover:text-brand-primary"
            }`}
          >
            <span>{f.emoji}</span> {f.label}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-semibold text-brand-text mb-2">Nenhuma viagem disponível nesta categoria</p>
          <p className="text-sm">Confira as outras categorias ou entre em contato com a Lisa.</p>
        </div>
      ) : (
        <ViagensDoBancoCards viagens={filtradas} />
      )}
    </div>
  );
}
