interface SeloRealProps {
  className?: string;
}

export default function SeloReal({ className = "" }: SeloRealProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white font-semibold rounded-full whitespace-nowrap select-none text-[9px] px-2 py-0.5 sm:text-[10px] sm:px-2.5 sm:py-1 ${className}`}
    >
      📸 Excursão Real Amo Viajar
    </span>
  );
}
