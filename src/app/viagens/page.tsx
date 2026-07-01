import type { Metadata } from "next";
import Header from "@/components/Header";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";
import ViagensClientPage from "./ViagensClientPage";

export const metadata: Metadata = {
  title: "Próximas Viagens | Amo Viajar",
  description: "Veja todas as próximas excursões da Amo Viajar — serra, praia, fé e cultura. Reserve sua vaga agora com a Lisa.",
};

export default function ViagensPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="bg-[#FFF8F0] py-14 text-center px-5">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Reserve sua vaga
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-brand-text font-bold mb-4">
            Próximas Viagens
          </h1>
          <p className="text-brand-muted max-w-xl mx-auto text-base">
            Vagas limitadas por lote — quanto antes você reservar, melhor o preço.
          </p>
        </div>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <ViagensClientPage />
          </div>
        </section>

        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
