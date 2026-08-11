/** Avaliação em estrelas com preenchimento parcial (ex.: 4,7). */
export default function Stars({
  rating,
  size = 12,
}: {
  rating: number;
  size?: number;
}) {
  const id = `stars-${rating}`.replace(".", "-");
  const percent = (rating / 5) * 100;

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Nota ${rating.toFixed(1)} de 5`}
      title={`${rating.toFixed(1)} de 5`}
    >
      <svg
        width={size * 5 + 8}
        height={size}
        viewBox="0 0 100 20"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={id}>
            <stop offset={`${percent}%`} stopColor="#38d8f5" />
            <stop offset={`${percent}%`} stopColor="#2a3746" />
          </linearGradient>
        </defs>
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            transform={`translate(${i * 20} 0)`}
            d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"
            fill={`url(#${id})`}
          />
        ))}
      </svg>
      <span className="text-[10px] font-semibold text-silver-200 tabular-nums">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
