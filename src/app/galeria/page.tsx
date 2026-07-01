import type { Metadata } from "next";
import Header from "@/components/Header";
import Galeria from "@/components/Galeria";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Galeria — Álbum da Família | Amo Viajar",
  description: "Fotos reais das excursões da Amo Viajar. Memórias de passageiros que já viveram experiências incríveis com a Lisa.",
};

export default function GaleriaPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="bg-brand-warm py-14 text-center">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">Álbum da Família</p>
          <h1 className="font-serif text-4xl md:text-5xl text-brand-text font-bold mb-4">
            Nossas Memórias
          </h1>
          <p className="text-brand-muted max-w-xl mx-auto text-base">
            Cada foto é uma história real. Cada rosto é um novo amigo que a viagem trouxe.
          </p>
        </div>
        <Galeria />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
