const numeros = [
  {
    icon: "🚌",
    valor: "1.200+",
    titulo: "passageiros viajaram conosco",
    cor: "bg-brand-primary/10 text-brand-primary",
  },
  {
    icon: "❤️",
    valor: "3 anos",
    titulo: "criando memórias e amizades",
    cor: "bg-rose-50 text-rose-500",
  },
  {
    icon: "📍",
    valor: "100+",
    titulo: "experiências realizadas",
    cor: "bg-green-50 text-green-600",
  },
  {
    icon: "🤝",
    valor: "∞",
    titulo: "uma comunidade que cresce a cada viagem",
    cor: "bg-purple-50 text-purple-600",
  },
];

export default function NossaHistoria() {
  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-5">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Fundada em fevereiro de 2023
          </p>
          <h2 className="section-title mb-4">
            Números que contam{" "}
            <span className="italic text-brand-primary">nossa história</span>
          </h2>
          <p className="section-subtitle">
            Cada número aqui representa uma pessoa real, uma viagem real
            e uma memória que ficou para sempre.
          </p>
        </div>

        {/* Grid de números */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {numeros.map(({ icon, valor, titulo, cor }) => (
            <div
              key={titulo}
              className="flex flex-col items-center text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-6 gap-3 hover:shadow-md transition-shadow duration-200"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${cor}`}>
                {icon}
              </div>
              <div className="font-serif text-3xl md:text-4xl font-bold text-brand-text leading-none">
                {valor}
              </div>
              <p className="text-brand-muted text-xs md:text-sm leading-tight">
                {titulo}
              </p>
            </div>
          ))}
        </div>

        {/* Linha emocional */}
        <div className="mt-12 text-center">
          <p className="text-brand-muted text-base md:text-lg italic max-w-2xl mx-auto leading-relaxed">
            "Começamos pequenos, em fevereiro de 2023. Cada viagem trouxe novas pessoas,
            novas histórias e novos amigos. Hoje somos uma família."
          </p>
          <p className="text-brand-primary font-semibold text-sm mt-3">— Lisa, fundadora da Amo Viajar</p>
        </div>

      </div>
    </section>
  );
}
