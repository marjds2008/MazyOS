import type { Metadata } from "next";
import Header from "@/components/Header";
import SobreLisa from "@/components/SobreLisa";
import VideoLisa from "@/components/VideoLisa";
import Diferenciais from "@/components/Diferenciais";
import CredenciaisLisa from "@/components/CredenciaisLisa";
import NossaHistoria from "@/components/NossaHistoria";
import Historias from "@/components/Historias";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sobre Lisa e a Amo Viajar",
  description: "Conheça a história da Lisa, fundadora da Amo Viajar — guia de turismo, Cadastur ativo, e mais de 1.200 passageiros felizes em 3 anos de experiências inesquecíveis.",
};

export default function SobrePage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <SobreLisa />
        <VideoLisa />
        <Diferenciais />
        <CredenciaisLisa />
        <NossaHistoria />
        <Historias />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
