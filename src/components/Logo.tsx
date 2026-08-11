import Image from "next/image";
import Link from "next/link";
import { cx } from "@/lib/format";

/**
 * Logo da marca.
 *
 * `public/logo.png` é o emblema quadrado (lobo + anel), recortado da arte
 * original. A arte completa, com o wordmark e o fundo de fumaça, fica em
 * `public/logo-full.png` e é usada na prévia de compartilhamento.
 *
 * O emblema aparece dentro de um selo arredondado com borda bem sutil: como o
 * fundo dele é quase da cor do site, a borda é o que dá contorno no tamanho
 * pequeno do cabeçalho.
 *
 * O wordmark ao lado é texto de verdade (não imagem) — o "MOLDARTE 3D" de
 * dentro da arte ficaria pequeno demais para ler aqui.
 */
const LOGO_SRC = "/logo.png";

export default function Logo({
  className,
  size = 40,
  showWordmark = true,
  href = "/",
}: {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  href?: string | null;
}) {
  const content = (
    <span className={cx("group flex items-center gap-3", className)}>
      <span
        className="relative shrink-0 overflow-hidden rounded-xl ring-1 ring-white/12 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:ring-cyan-400/45"
        style={{
          width: size,
          height: size,
          boxShadow: "0 0 22px -8px rgba(56,216,245,0.55)",
        }}
      >
        <Image
          src={LOGO_SRC}
          alt="Moldarte 3D"
          fill
          sizes={`${size}px`}
          priority
          className="object-cover"
        />
      </span>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-[0.16em] text-white">
            MOLDARTE
            <span className="ml-1 text-cyan-400">3D</span>
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-[0.34em] text-silver-400">
            impressão 3D
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Moldarte 3D — início">
      {content}
    </Link>
  );
}
