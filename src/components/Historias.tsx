const WHATSAPP_NUMBER = "5521985131616";

const historias = [
  {
    nome: "Cleide Aparecida",
    cidade: "Niterói, RJ",
    destino: "Ilha Grande",
    quote:
      "Minha primeira viagem sozinha aos 63 anos. Tinha muito medo. A Lisa me recebeu como se eu fosse da família. Voltei com três amigas novas.",
    emoji: "🌊",
    cor: "bg-blue-50 border-blue-100",
    corEmoji: "bg-blue-100",
    destaque: true,
  },
  {
    nome: "Maria das Graças",
    cidade: "Rio de Janeiro, RJ",
    destino: "Aparecida do Norte",
    quote:
      "Chorei de emoção dentro da Basílica. A Lisa organizou tudo com tanto cuidado. Foi uma experiência espiritual que vou carregar para sempre.",
    emoji: "✨",
    cor: "bg-purple-50 border-purple-100",
    corEmoji: "bg-purple-100",
    destaque: false,
  },
  {
    nome: "Vera e Rosangela",
    cidade: "São Gonçalo, RJ",
    destino: "Penedo",
    quote:
      "Sentamos lado a lado no ônibus por acaso. Hoje somos amigas inseparáveis. A Amo Viajar nos apresentou — isso não tem preço.",
    emoji: "❤️",
    cor: "bg-rose-50 border-rose-100",
    corEmoji: "bg-rose-100",
    destaque: false,
  },
  {
    nome: "José Renato",
    cidade: "Petrópolis, RJ",
    destino: "Visconde de Mauá",
    quote:
      "Depois que me aposentei, achei que as aventuras tinham acabado. Já fiz sete viagens com a Lisa. Cada uma foi melhor que a anterior.",
    emoji: "🏔️",
    cor: "bg-green-50 border-green-100",
    corEmoji: "bg-green-100",
    destaque: false,
  },
  {
    nome: "Benedita Santos",
    cidade: "Duque de Caxias, RJ",
    destino: "Petrópolis",
    quote:
      "Perdi meu marido há dois anos. Uma amiga me convidou para a excursão. Hoje faço parte da família Amo Viajar e não me sinto mais sozinha.",
    emoji: "🌸",
    cor: "bg-amber-50 border-amber-100",
    corEmoji: "bg-amber-100",
    destaque: true,
  },
  {
    nome: "Neuza Figueiredo",
    cidade: "Magé, RJ",
    destino: "Búzios",
    quote:
      "Já viajei mais de 10 vezes com a Lisa. Sempre tem surpresa, sempre tem alegria. É a melhor decisão que tomo todo mês.",
    emoji: "🌞",
    cor: "bg-orange-50 border-orange-100",
    corEmoji: "bg-orange-100",
    destaque: false,
  },
];

export default function Historias() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá, Lisa! Quero compartilhar minha experiência com a Amo Viajar.")}`;

  return (
    <section id="historias" className="py-20 md:py-28 bg-brand-light">
      <div className="max-w-6xl mx-auto px-5">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Mural da comunidade
          </p>
          <h2 className="section-title mb-4">
            Histórias{" "}
            <span className="italic text-brand-primary">Reais</span>
          </h2>
          <p className="section-subtitle">
            Quem viaja com a Amo Viajar tem uma história para contar.
            Essas são algumas delas.
          </p>
        </div>

        {/* Grid estilo mural */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {historias.map((h, i) => (
            <div
              key={i}
              className={`relative rounded-3xl border p-6 flex flex-col gap-4 ${h.cor} ${
                h.destaque ? "ring-1 ring-brand-primary/30 shadow-md" : "shadow-sm"
              }`}
            >
              {/* Emoji decorativo */}
              <div className={`w-12 h-12 rounded-2xl ${h.corEmoji} flex items-center justify-center text-2xl`}>
                {h.emoji}
              </div>

              {/* Quote */}
              <blockquote className="text-brand-text leading-relaxed text-base flex-1">
                "{h.quote}"
              </blockquote>

              {/* Assinatura */}
              <div className="pt-3 border-t border-black/5">
                <div className="font-semibold text-brand-text text-sm">{h.nome}</div>
                <div className="text-brand-muted text-xs mt-0.5">{h.cidade}</div>
                <div className="inline-flex items-center gap-1 mt-2 bg-white/70 rounded-full px-2.5 py-0.5 text-xs text-brand-muted">
                  <span>📍</span> {h.destino}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA para contar história */}
        <div className="mt-14 bg-white rounded-3xl p-8 md:p-10 text-center shadow-sm border border-gray-100">
          <div className="text-3xl mb-4">✍️</div>
          <h3 className="font-serif text-2xl text-brand-text mb-3">
            Você também tem uma história para contar
          </h3>
          <p className="text-brand-muted mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Se você já viajou com a Amo Viajar e quer compartilhar sua experiência,
            a Lisa vai adorar ouvir. Sua história pode inspirar alguém a dar o primeiro passo.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp inline-flex"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Contar minha história para a Lisa
          </a>
        </div>

      </div>
    </section>
  );
}
