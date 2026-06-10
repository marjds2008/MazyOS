import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amo Viajar — Admin",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
