"use client";

import { useState } from "react";
import Image from "next/image";
import SeloReal from "@/components/SeloReal";

// 100% fotos reais da Amo Viajar — adicionar novas fotos aqui conforme disponíveis
const fotos = [
  {
    src: "/fotos/destinos/anivesario-amo-viajar.jpeg",
    alt: "Grande grupo da Amo Viajar reunido em excursão com faixa Excursão Amoviajar.RJ",
    legenda: "Nossa família crescendo a cada viagem",
    tipo: "pessoas",
    grande: true,
  },
  {
    src: "/fotos/destinos/sao-lourenco.jpeg",
    alt: "Grupo da Amo Viajar no Parque das Águas de São Lourenço com faixa Excursão Amoviajar.RJ",
    legenda: "São Lourenço — Parque das Águas",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/templo-salomao.jpeg",
    alt: "Grupo da Amo Viajar na frente do Templo de Salomão com faixa Excursão Amo Viajar",
    legenda: "Templo de Salomão — fé e espiritualidade",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/friburgo.jpeg",
    alt: "Grupo da Amo Viajar na Fazenda das Flores em Nova Friburgo com faixa Excursão Amoviajar.RJ",
    legenda: "Fazenda das Flores — Nova Friburgo",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/lumiar.jpeg",
    alt: "Grupo da Amo Viajar em Lumiar, Nova Friburgo, com casas coloridas ao fundo",
    legenda: "Lumiar — a vila encantada da serra",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/cabo-frio.png",
    alt: "Grupo da Amo Viajar reunido em Cabo Frio com tela de praia ao fundo",
    legenda: "Cabo Frio — sol, praia e muita alegria",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/campos-do-jordao.jpeg",
    alt: "Grupo da Amo Viajar em Campos do Jordão",
    legenda: "Campos do Jordão — a suíça brasileira",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/angra.jpeg",
    alt: "Grupo da Amo Viajar em Angra dos Reis com baías ao fundo",
    legenda: "Angra dos Reis — paraíso em cada ilha",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/visconde-maua.jpeg",
    alt: "Grupo da Amo Viajar em Visconde de Mauá entre cachoeiras e natureza",
    legenda: "Visconde de Mauá — natureza em estado puro",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/vassouras.jpeg",
    alt: "Grupo da Amo Viajar em Vassouras com fazendas históricas ao fundo",
    legenda: "Vassouras — o Vale do Paraíba histórico",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/friburgo2.jpeg",
    alt: "Grupo da Amo Viajar em Nova Friburgo aproveitando a serra fluminense",
    legenda: "Nova Friburgo — a cidade das flores",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/conservatoria.jpeg",
    alt: "Grupo da Amo Viajar em Conservatória, capital nacional da seresta",
    legenda: "Conservatória — música e tradição",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/migue-pereira3.jpeg",
    alt: "Grupo da Amo Viajar em Miguel Pereira, serra do Rio de Janeiro",
    legenda: "Miguel Pereira — natureza e qualidade de vida",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/penedo.jpeg",
    alt: "Grupo da Amo Viajar em Penedo, a pequena Finlândia brasileira",
    legenda: "Penedo — charme e natureza na serra",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/buzios.jpeg",
    alt: "Grupo da Amo Viajar em Búzios aproveitando as praias",
    legenda: "Búzios — a Saint-Tropez brasileira",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/petropolis-bauerfest.jpeg",
    alt: "Grupo da Amo Viajar em Petrópolis na Bauerfest",
    legenda: "Petrópolis — a cidade imperial",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/ilha-grande.jpeg",
    alt: "Grupo da Amo Viajar em Ilha Grande, paraíso ecológico do Rio",
    legenda: "Ilha Grande — praias e natureza preservada",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/paraty.jpeg",
    alt: "Grupo da Amo Viajar em Paraty, patrimônio histórico da UNESCO",
    legenda: "Paraty — história, cultura e mar",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/aparecida.jpg",
    alt: "Grupo da Amo Viajar em Aparecida do Norte, na Basílica Nacional",
    legenda: "Aparecida do Norte — fé e devoção",
    tipo: "pessoas",
    grande: false,
  },
  {
    src: "/fotos/destinos/niver-amo-viajar-2026.jpeg",
    alt: "Celebração do aniversário da Amo Viajar em 2026 com toda a família de passageiros",
    legenda: "Aniversário Amo Viajar 2026 — nossa família crescendo",
    tipo: "pessoas",
    grande: true,
  },
  {
    src: "/fotos/hero/grupo-viagem1.png",
    alt: "Grupo de passageiros da Amo Viajar em excursão com faixa e tela de praia",
    legenda: "Unidos em cada destino",
    tipo: "pessoas",
    grande: true,
  },
];

export default function Galeria() {
  const [fotoAberta, setFotoAberta] = useState<null | typeof fotos[0]>(null);

  return (
    <section className="py-20 md:py-28 bg-brand-text">
      <div className="max-w-6xl mx-auto px-5">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Álbum da família
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight mb-4">
            Nossas{" "}
            <span className="italic text-brand-primary">Memórias</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Fotos reais das nossas excursões. Pessoas reais, destinos reais,
            momentos que ficam para sempre.
          </p>
        </div>

        {/* Grid de fotos reais */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fotos.map((foto, i) => (
            <button
              key={i}
              onClick={() => setFotoAberta(foto)}
              className={`relative overflow-hidden rounded-xl group focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                foto.grande ? "col-span-2 md:col-span-2" : "col-span-1"
              }`}
              style={{ aspectRatio: foto.grande ? "16/9" : "4/3" }}
              aria-label={`Ampliar foto: ${foto.legenda}`}
            >
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes={foto.grande
                  ? "(max-width: 768px) 100vw, 66vw"
                  : "(max-width: 768px) 50vw, 33vw"
                }
              />

              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col items-center justify-center gap-2 p-4">
                {/* Ícone de lupa */}
                <svg
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center leading-snug drop-shadow">
                  {foto.legenda}
                </p>
              </div>

              {/* Selo de autenticidade */}
              <div className="absolute bottom-2 left-2">
                <SeloReal />
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-white/50 text-sm mb-4">
            Cada viagem gera novas memórias. Venha criar as suas.
          </p>
          <a
            href="#viagens"
            className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-brand-dark transition-colors duration-200"
          >
            Ver próximas viagens →
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {fotoAberta && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFotoAberta(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFotoAberta(null)}
              className="absolute -top-12 right-0 text-white text-sm flex items-center gap-1.5 hover:text-brand-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Fechar
            </button>
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <Image
                src={fotoAberta.src}
                alt={fotoAberta.alt}
                fill
                className="object-contain bg-black"
                sizes="90vw"
              />
            </div>
            <p className="text-white/70 text-center mt-4 text-sm italic">{fotoAberta.legenda}</p>
          </div>
        </div>
      )}
    </section>
  );
}
