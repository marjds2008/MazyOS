"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const prints = [
  { src: "/fotos/depoimentos/depoimento01.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento02.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento03.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento04.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento05.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento06.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento07.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento08.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
  { src: "/fotos/depoimentos/depoimento09.jpeg", alt: "Depoimento real de passageiro da Amo Viajar" },
];

const principal   = prints[0];
const secundarios = prints.slice(1);

function Estrelas() {
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Depoimentos({ compact }: { compact?: boolean } = {}) {
  const [aberto, setAberto] = useState<number | null>(null);
  const listaSecundaria = compact ? prints.slice(1, 4) : prints.slice(1);

  const fechar   = useCallback(() => setAberto(null), []);
  const anterior = useCallback(() =>
    setAberto((i) => (i !== null ? (i - 1 + prints.length) % prints.length : null)), []);
  const proximo  = useCallback(() =>
    setAberto((i) => (i !== null ? (i + 1) % prints.length : null)), []);

  useEffect(() => {
    if (aberto === null) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape")     fechar();
      if (e.key === "ArrowLeft")  anterior();
      if (e.key === "ArrowRight") proximo();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [aberto, fechar, anterior, proximo]);

  useEffect(() => {
    document.body.style.overflow = aberto !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [aberto]);

  return (
    <section id="depoimentos" className="py-20 md:py-28 bg-brand-light">
      <div className="max-w-6xl mx-auto px-5">

        {/* ── Cabeçalho ── */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Quem já viajou conta
          </p>
          <h2 className="section-title mb-4">
            O que nossos passageiros dizem{" "}
            <span className="italic text-brand-primary">depois das viagens</span>
          </h2>
          <p className="section-subtitle">
            Mensagens reais recebidas após experiências vividas com a Amo Viajar.
          </p>
        </div>

        {/* ── Bloco de autoridade ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-7 mb-12 text-center max-w-lg mx-auto">
          <p className="font-serif text-3xl font-bold text-brand-primary mb-1">1.200+</p>
          <p className="text-brand-text font-semibold text-sm mb-3">
            passageiros já viajaram com a Amo Viajar
          </p>
          <Estrelas />
          <p className="text-brand-muted text-sm mt-3 leading-relaxed">
            Centenas de mensagens de carinho recebidas ao longo de 3 anos de histórias.
          </p>
        </div>

        {/* ── Texto de apoio ── */}
        <p className="text-center text-brand-muted text-sm mb-10 max-w-2xl mx-auto leading-relaxed">
          Entre centenas de mensagens recebidas ao longo dos anos, selecionamos algumas
          que representam o carinho dos passageiros da Amo Viajar.
        </p>

        {/* ── Destaque Principal ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <h3 className="text-brand-text font-bold text-sm uppercase tracking-widest whitespace-nowrap">
            ⭐ Destaque Principal da Comunidade
          </h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex justify-center mb-14">
          <button
            onClick={() => setAberto(0)}
            className="group relative w-full max-w-sm rounded-3xl overflow-hidden bg-white border-2 border-amber-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Ampliar destaque principal"
          >
            {/* Faixa premium */}
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 flex items-center justify-center gap-2">
              <span className="text-white text-xs font-bold uppercase tracking-widest">
                ⭐ Mais curtido pelos passageiros
              </span>
            </div>

            {/* Imagem natural */}
            <Image
              src={principal.src}
              alt={principal.alt}
              width={0}
              height={0}
              sizes="(max-width: 640px) 90vw, 384px"
              style={{ width: "100%", height: "auto" }}
              priority
              className="block"
            />

            {/* Overlay hover */}
            <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/8 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 rounded-full px-4 py-1.5 text-brand-text text-xs font-semibold shadow-md">
                Clique para ler
              </div>
            </div>

            {/* Rodapé */}
            <div className="px-4 pb-3 pt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 bg-black/60 text-white font-semibold rounded-full text-[9px] px-2 py-0.5 sm:text-[10px] sm:px-2.5 sm:py-1">
                💬 Depoimento Real
              </span>
              <span className="text-amber-500 text-xs font-medium">1/{prints.length}</span>
            </div>
          </button>
        </div>

        {/* ── Mais depoimentos — masonry ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <h3 className="text-brand-text font-bold text-sm uppercase tracking-widest whitespace-nowrap">
            Mais depoimentos
          </h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
          {listaSecundaria.map((print, i) => (
            <div key={print.src} className="break-inside-avoid mb-5">
              <button
                onClick={() => setAberto(i + 1)}
                className="group w-full text-left rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label={`Ampliar depoimento ${i + 2}`}
              >
                <Image
                  src={print.src}
                  alt={print.alt}
                  width={0}
                  height={0}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                  style={{ width: "100%", height: "auto" }}
                  loading="lazy"
                  className="block group-hover:brightness-[0.97] transition-all duration-200"
                />
                <div className="px-3 pb-3 pt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 bg-black/60 text-white font-semibold rounded-full text-[9px] px-2 py-0.5 sm:text-[10px] sm:px-2.5 sm:py-1">
                    💬 Depoimento Real
                  </span>
                  <span className="text-brand-muted text-[10px]">{i + 2}/{prints.length}</span>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* ── Link ver todos (modo compacto) ── */}
        {compact ? (
          <div className="text-center mt-10">
            <a href="/depoimentos" className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-full hover:bg-brand-dark transition-colors text-sm">
              Ver todos os depoimentos
            </a>
          </div>
        ) : (
          <p className="text-center text-brand-muted text-sm mt-10 max-w-lg mx-auto leading-relaxed italic">
            "Essas mensagens representam o carinho de passageiros que viveram momentos especiais com a Amo Viajar."
          </p>
        )}
      </div>

      {/* ── Lightbox ── */}
      {aberto !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={fechar}
        >
          {/* Setas desktop */}
          <button
            onClick={(e) => { e.stopPropagation(); anterior(); }}
            className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full items-center justify-center text-white transition-colors"
            aria-label="Anterior"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); proximo(); }}
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full items-center justify-center text-white transition-colors"
            aria-label="Próximo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Container */}
          <div
            className="relative flex flex-col items-center w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-white/50 text-sm">{aberto + 1} / {prints.length}</span>
              <button
                onClick={fechar}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Fechar
              </button>
            </div>

            <div className="w-full rounded-2xl overflow-hidden bg-white shadow-2xl max-h-[80vh] overflow-y-auto">
              <Image
                src={prints[aberto].src}
                alt={prints[aberto].alt}
                width={0}
                height={0}
                sizes="90vw"
                style={{ width: "100%", height: "auto" }}
                priority
              />
            </div>

            <div className="flex items-center gap-3 mt-4 md:hidden w-full">
              <button onClick={anterior} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-full text-sm font-medium transition-colors">
                ← Anterior
              </button>
              <button onClick={proximo} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-full text-sm font-medium transition-colors">
                Próximo →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
