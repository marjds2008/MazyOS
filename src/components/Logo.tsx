"use client";

import { useState } from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function Logo({
  className = "",
  imgClassName = "h-14 w-auto",
  fallbackClassName = "font-serif text-2xl font-bold text-brand-primary",
  width = 120,
  height = 120,
  priority = false,
}: LogoProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className={`${fallbackClassName} ${className} leading-none`}>
        Amo Viajar
      </span>
    );
  }

  return (
    <Image
      src="/fotos/logo/logo-amo-viajar.png"
      alt="Amo Viajar"
      width={width}
      height={height}
      className={`${imgClassName} ${className}`}
      priority={priority}
      onError={() => setError(true)}
    />
  );
}
