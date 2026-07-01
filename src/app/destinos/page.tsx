import type { Metadata } from "next";
import Header from "@/components/Header";
import ProximasViagens from "@/components/ProximasViagens";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Destinos da Amo Viajar — Serra, Praia, Fé e Cultura",
  description: "Conheça todos os destinos que a Amo Viajar já visitou: Nova Friburgo, Búzios, Aparecida, Petrópolis e muito mais. Fotos reais de cada excursão.",
};

export default function DestinosPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="bg-[#FFF8F0] py-14 text-center px-5">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">Excursões reais</p>
          <h1 className="font-serif text-4xl md:text-5xl text-brand-text font-bold mb-4">
            Nossos Destinos
          </h1>
          <p className="text-brand-muted max-w-xl mx-auto text-base">
            Serra, praia, fé e cultura — cada destino uma história diferente. Fotos e relatos reais das excursões da Amo Viajar.
          </p>
        </div>
        <ProximasViagens />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
