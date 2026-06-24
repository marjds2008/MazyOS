import type { Metadata } from "next";
import Image from "next/image";
import ListaVipForm from "./ListaVipForm";

export const metadata: Metadata = {
  title: "Lista VIP — Amo Viajar",
  description:
    "Receba em primeira mão novas excursões, promoções e oportunidades especiais antes da divulgação geral. Entre para a Lista VIP da Amo Viajar.",
};

const porQueEntrar = [
  "Receba novas viagens antes da divulgação",
  "Prioridade em viagens com vagas limitadas",
  "Promoções exclusivas para membros VIP",
  "Gratuito e sem compromisso",
];

const beneficios = [
  { emoji: "✈️", text: "Receba novas viagens antes da divulgação geral" },
  { emoji: "🎯", text: "Prioridade em viagens com vagas limitadas" },
  { emoji: "💎", text: "Promoções e condições especiais para membros VIP" },
  { emoji: "🎁", text: "Sorteios exclusivos para participantes da lista" },
  { emoji: "🗺️", text: "Aviso antecipado de novos roteiros e excursões" },
];

const provaSocial = [
  { emoji: "👥", stat: "Mais de 1.200 passageiros atendidos" },
  { emoji: "📅", stat: "3 anos realizando excursões" },
  { emoji: "🤝", stat: "Viagens em grupo com acompanhamento" },
];

export default function ListaVipPage() {
  return (
    <main className="min-h-screen bg-brand-warm">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-12 w-12 rounded-full overflow-hidden relative border border-gray-100 shadow-sm">
            <Image
              src="/fotos/logo/logo-amo-viajar.png"
              alt="Amo Viajar"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Text */}
          <div className="order-2 md:order-1">
            <span className="inline-block bg-brand-primary/10 text-brand-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              Lista VIP — Amo Viajar
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-brand-text leading-tight mb-5">
              Viaje antes<br />
              <span className="text-brand-primary">de todo mundo</span>
            </h1>
            {/* Ajuste 1 — subheadline com foco no benefício */}
            <p className="text-brand-muted text-lg leading-relaxed mb-8">
              Receba em primeira mão novas excursões, promoções e oportunidades
              especiais antes da divulgação geral.
            </p>
            <a
              href="#formulario"
              className="btn-primary inline-flex text-base"
            >
              Quero receber as viagens primeiro →
            </a>
            {/* Ajuste 1 — micro prova social no hero */}
            <p className="mt-4 text-sm text-brand-muted">
              Gratuito · Sem compromisso · Só vantagens
            </p>
            <p className="mt-3 text-sm text-brand-accent font-medium">
              ✓ Mais de 1.200 passageiros já viajaram com a Amo Viajar
            </p>
          </div>

          {/* Lisa */}
          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative">
              {/* Ajuste 5 — sizes para performance mobile */}
              <div className="w-72 h-80 md:w-80 md:h-[420px] relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/lisa.png"
                  alt="Lisa — fundadora da Amo Viajar"
                  fill
                  sizes="(max-width: 768px) 288px, 320px"
                  className="object-cover object-top"
                  priority
                />
              </div>
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100">
                <p className="text-sm font-bold text-brand-text">Lisa</p>
                <p className="text-xs text-brand-muted">Fundadora da Amo Viajar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ajuste 3 — Por que entrar agora? */}
      <section className="bg-white py-12 px-5">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-brand-text text-center mb-8">
            Por que entrar agora?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {porQueEntrar.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 bg-brand-warm rounded-2xl px-5 py-4"
              >
                <span className="text-brand-accent font-bold text-lg shrink-0 mt-0.5">✅</span>
                <p className="text-brand-text font-medium leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ajuste 4 — Mensagem humana da Lisa */}
      <section className="py-14 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden relative shrink-0 border border-gray-100">
                <Image src="/lisa.png" alt="Lisa" fill className="object-cover object-top" />
              </div>
              <div>
                <p className="font-bold text-brand-text text-sm">Uma mensagem da Lisa</p>
                <p className="text-xs text-brand-muted">Fundadora da Amo Viajar</p>
              </div>
            </div>
            <div className="space-y-4 text-brand-text leading-relaxed">
              <p>
                Criei a Amo Viajar para ajudar pessoas a viver experiências incríveis
                sem precisar se preocupar com organização, hospedagem ou roteiro.
              </p>
              <p>
                A Lista VIP é a forma de avisar você antes de todo mundo sobre
                nossas próximas viagens.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="font-bold text-brand-text">Lisa</p>
              <p className="text-sm text-brand-muted">Fundadora da Amo Viajar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ajuste 5 — Prova social */}
      <section className="bg-white py-12 px-5">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-brand-text text-center mb-8">
            Confiança construída viajando juntos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {provaSocial.map((item) => (
              <div
                key={item.stat}
                className="flex flex-col items-center text-center gap-3 bg-brand-warm rounded-2xl px-5 py-6"
              >
                <span className="text-3xl">{item.emoji}</span>
                <p className="text-brand-text font-semibold text-sm leading-snug">{item.stat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-14 px-5">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-brand-text text-center mb-8">
            O que você ganha sendo VIP
          </h2>
          <div className="flex flex-col gap-3">
            {beneficios.map((b) => (
              <div
                key={b.text}
                className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100"
              >
                <span className="text-2xl shrink-0">{b.emoji}</span>
                <p className="text-brand-text font-medium">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário — Ajuste 7: mantido exatamente como estava */}
      <section id="formulario" className="py-16 px-5 bg-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl text-brand-text mb-3">
              Entrar para a Lista VIP
            </h2>
            <p className="text-brand-muted">
              Preencha abaixo e garanta seu lugar.
            </p>
          </div>
          <ListaVipForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-brand-warm py-10 px-5 text-center">
        <div className="h-14 w-14 rounded-full overflow-hidden relative mx-auto mb-4 border border-gray-100 shadow-sm">
          <Image
            src="/fotos/logo/logo-amo-viajar.png"
            alt="Amo Viajar"
            fill
            className="object-cover"
          />
        </div>
        {/* Ajuste 3 — credencial institucional */}
        <p className="text-xs text-brand-muted mb-1">
          Agência cadastrada no Ministério do Turismo
        </p>
        <p className="text-sm text-brand-muted">
          © {new Date().getFullYear()} Amo Viajar · Todos os direitos reservados
        </p>
      </footer>
    </main>
  );
}
