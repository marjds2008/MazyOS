import Image from "next/image";

const WHATSAPP_NUMBER = "5521985131616";
const WHATSAPP_MESSAGE = "Olá, Lisa! Vi o seu site e quero conhecer mais sobre as viagens da Amo Viajar. 😊";

const stats = [
  { icon: "🚌", valor: "1.200+", label: "Passageiros atendidos" },
  { icon: "📍", valor: "100+", label: "Experiências realizadas" },
  { icon: "❤️", valor: "Família", label: "Amo Viajar" },
];

export default function SobreLisa() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <section id="sobre" className="py-20 md:py-28 bg-brand-warm overflow-hidden">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center">

          {/* ── Coluna da foto ── */}
          <div className="relative order-2 md:order-1 flex justify-center">

            {/* Mancha decorativa atrás da foto */}
            <div
              className="absolute inset-0 rounded-[3rem] bg-brand-primary/10 -rotate-3 scale-95"
              aria-hidden="true"
            />

            {/* Foto da Lisa */}
            <div
              className="relative w-full max-w-[340px] md:max-w-none rounded-[2.5rem] overflow-hidden shadow-2xl"
              style={{ aspectRatio: "3/4" }}
            >
              <Image
                src="/lisa.png"
                alt="Lisa, fundadora da Amo Viajar, sorrindo com a camiseta da marca"
                fill
                className="object-cover object-top"
                style={{ filter: "brightness(1.02) contrast(1.04) saturate(1.06)" }}
                sizes="(max-width: 768px) 90vw, 45vw"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Badge topo esquerdo */}
            <div className="absolute -top-4 -left-2 md:-left-6 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-[190px]">
              <span className="text-2xl" aria-hidden="true">⭐</span>
              <div>
                <div className="font-bold text-brand-text text-sm leading-tight">1.200+</div>
                <div className="text-brand-muted text-xs">Passageiros felizes</div>
              </div>
            </div>

            {/* Badge rodapé direito */}
            <div className="absolute -bottom-4 -right-2 md:-right-6 bg-brand-primary rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-[200px]">
              <span className="text-2xl" aria-hidden="true">❤️</span>
              <div>
                <div className="font-bold text-white text-sm leading-tight">Família</div>
                <div className="text-white/80 text-xs">Amo Viajar</div>
              </div>
            </div>
          </div>

          {/* ── Coluna de texto ── */}
          <div className="order-1 md:order-2">

            {/* Subtítulo posicionador */}
            <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-2">
              Conheça quem estará ao seu lado em cada viagem
            </p>

            <h2 className="font-serif text-4xl md:text-5xl text-brand-text leading-tight mb-6">
              Muito prazer,{" "}
              <em className="not-italic text-brand-primary">eu sou a Lisa.</em>
            </h2>

            <div className="space-y-4 text-brand-muted leading-relaxed text-base">
              <p>
                A Amo Viajar nasceu da minha paixão por conhecer lugares, viver
                experiências e compartilhar momentos especiais com outras pessoas.
              </p>
              <p>
                Ao longo dos anos percebi que as viagens eram apenas o começo.
                Muitas amizades surgiram dentro dos ônibus. Muitas histórias foram
                compartilhadas durante os passeios. Muitas pessoas chegaram
                sozinhas e voltaram para casa com novos amigos.
              </p>
              <p>
                Hoje tenho orgulho de dizer que a Amo Viajar é muito mais do que
                uma empresa de excursões. É uma comunidade de pessoas que gostam
                de viver, conhecer, sorrir e colecionar memórias.
              </p>
            </div>

            {/* Quote destacada */}
            <blockquote className="mt-8 border-l-4 border-brand-primary pl-5 italic text-brand-text text-lg leading-snug">
              "Cada passageiro que embarca comigo se torna parte da minha família."
            </blockquote>
            <p className="mt-2 pl-5 text-brand-muted text-sm font-medium">— Lisa, fundadora da Amo Viajar</p>

            {/* Stats horizontais */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {stats.map(({ icon, valor, label }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100"
                >
                  <div className="text-2xl mb-1" aria-hidden="true">{icon}</div>
                  <div className="font-bold text-brand-text text-lg leading-none">{valor}</div>
                  <div className="text-brand-muted text-xs mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>

            {/* CTA — Falar com a Lisa */}
            <div className="mt-8">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp inline-flex"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar com a Lisa
              </a>
              <p className="text-brand-muted text-xs mt-3">
                Resposta rápida · Atendimento pessoal · Sem robôs
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
