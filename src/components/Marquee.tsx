/** Faixa infinita de texto. O conteúdo é duplicado para o loop não ter emenda. */
export default function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const row = (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap">
          <span className="font-display text-sm font-medium uppercase tracking-[0.22em] text-silver-400">
            {item}
          </span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={`relative flex overflow-hidden border-y border-white/8 bg-navy-950 py-4 ${className ?? ""}`}
    >
      {/* Máscaras nas pontas para o texto sumir suavemente */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-navy-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-navy-950 to-transparent" />

      <div className="animate-marquee flex min-w-max">
        {row}
        {row}
      </div>

      {/* Texto acessível, sem duplicação para leitores de tela */}
      <span className="sr-only">{items.join(". ")}</span>
    </div>
  );
}
