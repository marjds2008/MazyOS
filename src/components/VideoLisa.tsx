export default function VideoLisa() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-5">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Direto da Lisa para você
          </p>
          <h2 className="section-title mb-3">Conheça a Lisa</h2>
          <p className="section-subtitle">Uma mensagem especial para você.</p>
        </div>

        {/* Player — Shorts vertical 9:16 centralizado */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ aspectRatio: "9/16" }}>
            <iframe
              src="https://www.youtube.com/embed/6v6Bw9YiTwo?rel=0&modestbranding=1"
              title="Lisa — Amo Viajar"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
