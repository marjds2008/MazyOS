import Image from "next/image";

const WHATSAPP_NUMBER = "5521985131616";
const WHATSAPP_MESSAGE = "Olá, Lisa! Vi o site e quero saber mais sobre as viagens da Amo Viajar. 😊";

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function HeroSection() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Fundo: foto real do grupo ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/fotos/hero/grupo-viagem1.png"
          alt="Grupo real de passageiros da Amo Viajar reunidos em viagem"
          fill
          className="object-cover"
          /*
           * object-position por breakpoint:
           * - Mobile (portrait): ancora em 65% vertical para mostrar o grupo
           *   e não só o céu — aplicado via style inline com media query no CSS
           * - Desktop: center center (foto landscape encaixa bem)
           */
          style={{ objectPosition: "center 65%" }}
          priority
          sizes="100vw"
        />

        {/* Overlay em camadas:
            - Topo: leve escurecimento (preserva o grupo visível)
            - Base: forte (garante legibilidade do texto)
            - Centro: gradiente suave de transição               */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

        {/* Vinheta lateral — melhora foco no centro em telas wide */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      {/* ── Conteúdo ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 text-center text-white pt-24 sm:pt-28 pb-16 sm:pb-20">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse shrink-0" />
          Vagas disponíveis para as próximas viagens
        </div>

        {/* Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-5 sm:mb-6 drop-shadow-lg">
          Viaje com quem{" "}
          <span className="text-brand-primary italic">cuida de você</span>
          {" "}em cada etapa da jornada
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-2 sm:mb-3">
          Na Amo Viajar, cada viagem é uma oportunidade de conhecer novos lugares,
          fazer amizades e viver experiências inesquecíveis.
        </p>
        <p className="text-sm sm:text-lg text-white/75 max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10">
          Com segurança, acolhimento e a companhia de quem já se tornou família.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="#viagens"
            className="btn-primary w-full sm:w-auto text-center !py-4 sm:!py-5 !px-8 sm:!px-10 !text-base sm:!text-lg"
          >
            Ver próximas viagens
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full sm:w-auto text-center !py-4 sm:!py-5 !px-8 sm:!px-10 !text-base sm:!text-lg"
          >
            <WhatsAppIcon />
            Falar com a Lisa
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-10 sm:mt-16 grid grid-cols-3 sm:flex sm:flex-row items-center justify-center gap-4 sm:gap-12">
          {[
            { value: "1.200+", label: "Passageiros felizes" },
            { value: "3 anos", label: "De história" },
            { value: "100+", label: "Experiências realizadas" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-xl sm:text-3xl font-bold text-brand-primary font-serif">{value}</div>
              <div className="text-white/70 text-xs sm:text-sm mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator — oculto em telas muito pequenas */}
      <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-1 text-white/50 text-xs animate-bounce">
        <span>Role para baixo</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
