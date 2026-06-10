const credenciais = [
  {
    icon: "🏛️",
    titulo: "Cadastur Ativo",
    descricao: "Registro oficial no Cadastro de Prestadores de Serviços Turísticos do Ministério do Turismo.",
    oficial: true,
    badge: "Credencial Oficial",
  },
  {
    icon: "🧭",
    titulo: "Guia de Turismo",
    descricao: "Credenciada pelo Ministério do Turismo para condução de grupos em viagens e passeios turísticos.",
    oficial: true,
    badge: "Ministério do Turismo",
  },
  {
    icon: "✈️",
    titulo: "Agente de Viagens",
    descricao: "Credenciada para planejamento, organização e venda de pacotes e excursões turísticas.",
    oficial: false,
    badge: null,
  },
  {
    icon: "🚌",
    titulo: "1.200+ Passageiros",
    descricao: "Mais de mil e duzentos passageiros acompanhados com segurança, cuidado e dedicação.",
    oficial: false,
    badge: null,
  },
  {
    icon: "❤️",
    titulo: "3 Anos de Experiência",
    descricao: "Desde fevereiro de 2023 criando experiências inesquecíveis e conexões verdadeiras entre pessoas.",
    oficial: false,
    badge: null,
  },
  {
    icon: "🤝",
    titulo: "Atendimento Pessoal",
    descricao: "Lisa acompanha cada viagem presencialmente. Sem representantes. Sem terceiros. Sem robôs.",
    oficial: false,
    badge: null,
  },
];

export default function CredenciaisLisa() {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-b from-white to-brand-light">
      <div className="max-w-6xl mx-auto px-5">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Quem você está contratando
          </p>
          <h2 className="section-title mb-4">
            Experiência, Segurança{" "}
            <span className="italic text-brand-primary">e Credibilidade</span>
          </h2>
          <p className="section-subtitle">
            Além da experiência adquirida ao longo de mais de 3 anos organizando excursões
            e acompanhando mais de 1.200 passageiros, Lisa possui credenciais oficiais que
            reforçam seu compromisso com a qualidade e a segurança em cada viagem.
          </p>
        </div>

        {/* Grid de credenciais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {credenciais.map(({ icon, titulo, descricao, oficial, badge }) => (
            <div
              key={titulo}
              className={[
                "relative bg-white rounded-3xl p-6 flex flex-col gap-4 transition-shadow duration-200 hover:shadow-lg",
                oficial
                  ? "border-2 border-brand-primary/40 shadow-md"
                  : "border border-gray-100 shadow-sm",
              ].join(" ")}
            >
              {/* Badge oficial */}
              {badge && (
                <div className="absolute -top-3 left-5">
                  <span className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    {badge}
                  </span>
                </div>
              )}

              {/* Ícone */}
              <div
                className={[
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                  oficial
                    ? "bg-brand-primary/10"
                    : "bg-brand-light",
                ].join(" ")}
              >
                {icon}
              </div>

              {/* Texto */}
              <div>
                <h3 className="font-semibold text-brand-text text-base mb-1.5 leading-snug">
                  {titulo}
                </h3>
                <p className="text-brand-muted text-sm leading-relaxed">
                  {descricao}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Linha de confiança */}
        <div className="mt-12 bg-white border border-brand-primary/20 rounded-3xl px-8 py-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left shadow-sm">
          <div className="text-4xl shrink-0">🛡️</div>
          <div>
            <p className="font-semibold text-brand-text text-base mb-1">
              Você viaja com quem tem nome, rosto e responsabilidade.
            </p>
            <p className="text-brand-muted text-sm leading-relaxed">
              A Lisa não é uma plataforma anônima. É uma profissional registrada, que embarca junto com você,
              cuida do grupo do início ao fim e responde por cada detalhe da viagem.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
