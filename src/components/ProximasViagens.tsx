"use client";

import { useState } from "react";
import Image from "next/image";
import SeloReal from "@/components/SeloReal";
import ModalLead from "@/components/ModalLead";

type Categoria = "todos" | "serra" | "praia" | "cultura" | "fe";

interface Destino {
  nome: string;
  estado: string;
  categoria: Exclude<Categoria, "todos">;
  descricao: string;
  imagem: string;
  real: boolean;       // true = foto real da Amo Viajar
  destaque?: boolean;
}

const destinos: Destino[] = [
  // ── Serra ──
  {
    nome: "Nova Friburgo",
    estado: "RJ",
    categoria: "serra",
    descricao: "A cidade das flores e do frio. Grupo na icônica Fazenda das Flores — natureza, beleza e muita alegria.",
    imagem: "/fotos/destinos/friburgo.jpeg",
    real: true,
    destaque: true,
  },
  {
    nome: "Lumiar",
    estado: "RJ",
    categoria: "serra",
    descricao: "A vila encantada da Serra. Casinhas coloridas, cachoeiras e o charme do interior fluminense.",
    imagem: "/fotos/destinos/lumiar.jpeg",
    real: true,
  },
  {
    nome: "Penedo",
    estado: "RJ",
    categoria: "serra",
    descricao: "A pequena Finlândia brasileira. Chalés encantadores, natureza exuberante e atmosfera única com o grupo Amo Viajar.",
    imagem: "/fotos/destinos/penedo.jpeg",
    real: true,
  },
  {
    nome: "Visconde de Mauá",
    estado: "RJ",
    categoria: "serra",
    descricao: "Cachoeiras, rios cristalinos e Mata Atlântica preservada. Natureza em estado puro com a alegria do grupo Amo Viajar.",
    imagem: "/fotos/destinos/visconde-maua.jpeg",
    real: true,
  },
  {
    nome: "Campos do Jordão",
    estado: "SP",
    categoria: "serra",
    descricao: "A suíça brasileira. Arquitetura europeia, artesanato, chocolates e um charme incomparável.",
    imagem: "/fotos/destinos/campos-do-jordao.jpeg",
    real: true,
  },

  // ── Praia ──
  {
    nome: "Cabo Frio",
    estado: "RJ",
    categoria: "praia",
    descricao: "Sol, areia e muita alegria! Nosso grupo adorou cada momento nesse destino incrível.",
    imagem: "/fotos/destinos/cabo-frio.png",
    real: true,
    destaque: true,
  },
  {
    nome: "Ilha Grande",
    estado: "RJ",
    categoria: "praia",
    descricao: "Paraíso ecológico com praias paradisíacas e trilhas em mata atlântica preservada — vivido com o grupo Amo Viajar.",
    imagem: "/fotos/destinos/ilha-grande.jpeg",
    real: true,
  },
  {
    nome: "Paraty",
    estado: "RJ",
    categoria: "praia",
    descricao: "Centro histórico colonial patrimônio da UNESCO com praias deslumbrantes ao redor — vivido com alegria pelo grupo Amo Viajar.",
    imagem: "/fotos/destinos/paraty.jpeg",
    real: true,
  },
  {
    nome: "Búzios",
    estado: "RJ",
    categoria: "praia",
    descricao: "A Saint-Tropez brasileira. Charmosa, elegante e com praias de tirar o fôlego — vivida com alegria pelo grupo Amo Viajar.",
    imagem: "/fotos/destinos/buzios.jpeg",
    real: true,
  },
  {
    nome: "Angra dos Reis",
    estado: "RJ",
    categoria: "praia",
    descricao: "Mais de 360 ilhas e baías paradisíacas. Passeio de barco, sol e o litoral mais bonito do Rio com o grupo Amo Viajar.",
    imagem: "/fotos/destinos/angra.jpeg",
    real: true,
  },

  // ── Cultura e História ──
  {
    nome: "São Lourenço",
    estado: "MG",
    categoria: "cultura",
    descricao: "Parque das Águas e águas minerais. Uma experiência de saúde, história e bem-estar inesquecível.",
    imagem: "/fotos/destinos/sao-lourenco.jpeg",
    real: true,
    destaque: true,
  },
  {
    nome: "Petrópolis",
    estado: "RJ",
    categoria: "cultura",
    descricao: "A cidade imperial. Museu do Imperador, catedral e uma atmosfera histórica única com o grupo Amo Viajar.",
    imagem: "/fotos/destinos/petropolis-bauerfest.jpeg",
    real: true,
  },
  {
    nome: "Vassouras",
    estado: "RJ",
    categoria: "cultura",
    descricao: "O Vale do Paraíba histórico. Fazendas imperiais do ciclo do café, casarões preservados e uma viagem no tempo com a família Amo Viajar.",
    imagem: "/fotos/destinos/vassouras.jpeg",
    real: true,
  },
  {
    nome: "Conservatória",
    estado: "RJ",
    categoria: "cultura",
    descricao: "A capital nacional da seresta. Música nas ruas, casarões antigos e alma brasileira autêntica com o grupo Amo Viajar.",
    imagem: "/fotos/destinos/conservatoria.jpeg",
    real: true,
  },
  {
    nome: "Miguel Pereira",
    estado: "RJ",
    categoria: "cultura",
    descricao: "Natureza, cultura e gastronomia. Uma das melhores qualidades de vida do estado do Rio — e momentos inesquecíveis com a família Amo Viajar.",
    imagem: "/fotos/destinos/migue-pereira3.jpeg",
    real: true,
  },

  // ── Fé e Espiritualidade ──
  {
    nome: "Templo de Salomão",
    estado: "SP",
    categoria: "fe",
    descricao: "Uma visita emocionante ao maior templo do Brasil. Fé, arquitetura monumental e experiência única.",
    imagem: "/fotos/destinos/templo-salomao.jpeg",
    real: true,
    destaque: true,
  },
  {
    nome: "Aparecida do Norte",
    estado: "SP",
    categoria: "fe",
    descricao: "A maior basílica do mundo. Uma experiência de fé, devoção e paz interior inesquecível com o grupo Amo Viajar.",
    imagem: "/fotos/destinos/aparecida.jpg",
    real: true,
  },
];

const categorias: { id: Categoria; label: string; emoji: string }[] = [
  { id: "todos", label: "Todos os destinos", emoji: "🗺️" },
  { id: "serra", label: "Serra", emoji: "🏔️" },
  { id: "praia", label: "Praia", emoji: "🏖️" },
  { id: "cultura", label: "Cultura e História", emoji: "🏛️" },
  { id: "fe", label: "Fé e Espiritualidade", emoji: "✨" },
];

const categoriaCor: Record<Exclude<Categoria, "todos">, string> = {
  serra:   "bg-green-100 text-green-700",
  praia:   "bg-blue-100 text-blue-700",
  cultura: "bg-amber-100 text-amber-700",
  fe:      "bg-purple-100 text-purple-700",
};

export default function ProximasViagens() {
  const [ativa, setAtiva] = useState<Categoria>("todos");
  const [modal, setModal] = useState<{ nome: string; estado: string } | null>(null);

  const filtrados = ativa === "todos" ? destinos : destinos.filter((d) => d.categoria === ativa);
  const cat = categorias.find((c) => c.id === ativa)!;

  return (
    <section id="viagens" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-5">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Escolha o seu destino
          </p>
          <h2 className="section-title mb-4">Destinos da Amo Viajar</h2>
          <p className="section-subtitle">
            Lugares incríveis, sempre com a companhia certa.
            Consulte a Lisa sobre datas e disponibilidade.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setAtiva(c.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                ativa === c.id
                  ? "bg-brand-primary text-white border-brand-primary shadow-md"
                  : "bg-white text-brand-muted border-gray-200 hover:border-brand-primary hover:text-brand-primary"
              }`}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Contador */}
        <p className="text-brand-muted text-sm text-center mb-8">
          {cat.emoji} {filtrados.length} destino{filtrados.length !== 1 ? "s" : ""}
          {ativa !== "todos" ? ` em ${cat.label}` : " disponíveis"}
          {" "}·{" "}
          <span className="text-brand-primary font-medium">
            {filtrados.filter(d => d.real).length} com fotos reais da Amo Viajar 📸
          </span>
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((d) => {

            return (
              <div
                key={d.nome}
                className={`group relative rounded-2xl overflow-hidden shadow-sm border flex flex-col transition-shadow duration-200 hover:shadow-lg ${
                  d.destaque ? "border-brand-primary/30 ring-1 ring-brand-primary/20" : "border-gray-100"
                }`}
              >
                {d.destaque && (
                  <div className="absolute top-3 left-3 z-10 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    ✦ Mais procurado
                  </div>
                )}

                {/* Selo de autenticidade */}
                {d.real && (
                  <div className="absolute bottom-3 right-3 z-10">
                    <SeloReal />
                  </div>
                )}

                {/* Imagem */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={d.imagem}
                    alt={`Excursão Amo Viajar para ${d.nome}, ${d.estado}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <div className="font-bold text-xl font-serif leading-tight">{d.nome}</div>
                    <div className="text-white/80 text-sm">{d.estado}</div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-5 flex flex-col gap-4 flex-1 bg-white">
                  <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full ${categoriaCor[d.categoria]}`}>
                    {categorias.find((c) => c.id === d.categoria)?.emoji}{" "}
                    {categorias.find((c) => c.id === d.categoria)?.label}
                  </span>
                  <p className="text-brand-muted text-sm leading-relaxed flex-1">{d.descricao}</p>
                  <button
                    onClick={() => setModal({ nome: d.nome, estado: d.estado })}
                    className="btn-whatsapp justify-center !py-3 !text-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Consultar próxima data
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <p className="text-brand-muted mb-4 text-base">
            Tem um destino em mente que não está na lista?
          </p>
          <button
            onClick={() => setModal({ nome: "outro destino", estado: "" })}
            className="btn-secondary"
          >
            Falar com a Lisa sobre outros destinos
          </button>
        </div>
      </div>

      {modal && (
        <ModalLead
          destino={modal.nome}
          estado={modal.estado}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
