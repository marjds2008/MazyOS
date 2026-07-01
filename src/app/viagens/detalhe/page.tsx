import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ViagemDetalheClient from "./ViagemDetalheClient";

export const metadata: Metadata = {
  title: "Detalhes da Viagem | Amo Viajar",
  description: "Reserve sua vaga para as melhores excursões com a Amo Viajar.",
};

export default function DetalhePage() {
  return (
    <>
      <Header />
      <main className="pt-20 bg-[#FFF8F0] min-h-screen">
        <ViagemDetalheClient />
      </main>
      <Footer />
    </>
  );
}
