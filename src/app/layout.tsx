import type { Metadata } from "next";
import "./globals.css";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  title: "Amo Viajar — Viaje com quem cuida de você",
  description:
    "Excursões e viagens em grupo para quem busca mais do que um destino: busca companhia, segurança e memórias inesquecíveis. Conheça a Família Amo Viajar.",
  keywords: "excursões, viagens em grupo, turismo 50+, viagens para idosos, excursões com segurança, Amo Viajar, Lisa",
  openGraph: {
    title: "Amo Viajar — Viajar é bom. Viajar acompanhado é melhor.",
    description:
      "Cada viagem começa com um destino. Termina com amizade. Faça parte da Família Amo Viajar.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
