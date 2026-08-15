/**
 * Avaliação em estrelas com preenchimento parcial (ex.: 4,7).
 *
 * Sem gradiente em `<defs>`: a versão anterior criava um id a partir da nota,
 * e duas peças com a mesma nota geravam o mesmo id na página. Id repetido é
 * HTML inválido, e basta uma delas mudar de nota para as duas passarem a
 * apontar para o gradiente errado. Aqui o preenchimento é uma faixa recortada
 * por CSS — não existe id nenhum para repetir.
 */

const ESTRELA =
  "M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z";

function Fileira({ cor, largura, altura }: { cor: string; largura: number; altura: number }) {
  return (
    <svg
      width={largura}
      height={altura}
      viewBox="0 0 100 20"
      fill="none"
      aria-hidden
      className="block max-w-none"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} transform={`translate(${i * 20} 0)`} d={ESTRELA} fill={cor} />
      ))}
    </svg>
  );
}

export default function Stars({
  rating,
  size = 12,
}: {
  rating: number;
  size?: number;
}) {
  const largura = size * 5 + 8;
  const preenchido = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Nota ${rating.toFixed(1)} de 5`}
      title={`${rating.toFixed(1)} de 5`}
    >
      <span className="relative inline-block" style={{ width: largura, height: size }}>
        <Fileira cor="#2a3746" largura={largura} altura={size} />
        {/* A faixa acesa por cima, cortada na proporção da nota. */}
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${preenchido}%` }}
        >
          <Fileira cor="#38d8f5" largura={largura} altura={size} />
        </span>
      </span>
      <span className="text-[10px] font-semibold text-silver-200 tabular-nums">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
