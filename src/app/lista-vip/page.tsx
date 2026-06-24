import type { Metadata } from "next";
import Image from "next/image";
import ListaVipForm from "./ListaVipForm";

export const metadata: Metadata = {
  title: "Lista VIP — Amo Viajar",
  description:
    "Entre para a Lista VIP da Amo Viajar e receba nossas viagens antes de todo mundo. Vagas limitadas, promoções exclusivas e prioridade nos melhores roteiros.",
};

const benefits = [
  { emoji: "✈️", text: "Receba novas viagens antes da divulgação geral" },
  { emoji: "🎯", text: "Prioridade em viagens com vagas limitadas" },
  { emoji: "💎", text: "Promoções e condições especiais para membros VIP" },
  { emoji: "🎁", text: "Sorteios exclusivos para participantes da lista" },
  { emoji: "🗺️", text: "Aviso antecipado de novos roteiros e excursões" },
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
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-20">
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
            <p className="text-brand-muted text-lg leading-relaxed mb-8">
              Estamos formando a Lista VIP oficial da Amo Viajar para quem deseja
              receber nossas viagens antes da divulgação geral.
            </p>
            <a
              href="#formulario"
              className="btn-primary inline-flex text-base"
            >
              Quero fazer parte da Lista VIP →
            </a>
            <p className="mt-4 text-sm text-brand-muted">
              Gratuito · Sem compromisso · Só vantagens
            </p>
          </div>

          {/* Lisa */}
          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative">
              <div className="w-72 h-80 md:w-80 md:h-[420px] relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/lisa.png"
                  alt="Lisa — fundadora da Amo Viajar"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              {/* Badge flutuante */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100">
                <p className="text-sm font-bold text-brand-text">Lisa</p>
                <p className="text-xs text-brand-muted">Fundadora da Amo Viajar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mensagem da Lisa */}
      <section className="bg-white py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0">
              <Image src="/lisa.png" alt="Lisa" fill className="object-cover object-top" />
            </div>
            <span className="text-sm font-semibold text-brand-text">Lisa, fundadora da Amo Viajar</span>
          </div>
          <blockquote className="font-serif text-xl md:text-2xl text-brand-text leading-relaxed italic">
            "Você não está comprando uma viagem de uma empresa desconhecida.
            Você está viajando com alguém que já levou centenas de pessoas
            para conhecer novos destinos."
          </blockquote>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-14 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-brand-text text-center mb-10">
            O que você ganha sendo VIP
          </h2>
          <div className="flex flex-col gap-3">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100"
              >
                <span className="text-2xl shrink-0">{b.emoji}</span>
                <p className="text-brand-text font-medium">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section id="formulario" className="py-16 px-6 bg-white">
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
      <footer className="border-t border-gray-100 bg-brand-warm py-10 px-6 text-center">
        <div className="h-14 w-14 rounded-full overflow-hidden relative mx-auto mb-4 border border-gray-100 shadow-sm">
          <Image
            src="/fotos/logo/logo-amo-viajar.png"
            alt="Amo Viajar"
            fill
            className="object-cover"
          />
        </div>
        <p className="text-sm text-brand-muted">
          © {new Date().getFullYear()} Amo Viajar · Todos os direitos reservados
        </p>
      </footer>
    </main>
  );
}
