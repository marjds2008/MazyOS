"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";

const WHATSAPP_NUMBER = "5521985131616";
const WHATSAPP_MESSAGE = "Olá, Lisa! Quero saber mais sobre as viagens da Amo Viajar.";

const navLinks = [
  { href: "#sobre", label: "Sobre a Lisa" },
  { href: "#viagens", label: "Viagens" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#clube", label: "Clube" },
  { href: "#contato", label: "Contato" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo
            imgClassName="h-14 w-auto drop-shadow-sm"
            fallbackClassName={`font-serif text-2xl font-bold leading-none ${
              scrolled ? "text-brand-primary" : "text-white drop-shadow"
            }`}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`font-medium text-sm transition-colors duration-200 hover:text-brand-primary ${
                scrolled ? "text-brand-text" : "text-white drop-shadow"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp !py-2.5 !px-5 !text-sm"
          >
            WhatsApp
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            scrolled ? "text-brand-text" : "text-white"
          }`}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="flex flex-col px-5 py-4 gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-brand-text font-medium border-b border-gray-50 hover:text-brand-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-3 justify-center"
              onClick={() => setMenuOpen(false)}
            >
              Falar com a Lisa no WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
