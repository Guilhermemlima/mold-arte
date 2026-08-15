"use client";

import Image from "next/image";
import { useId, useMemo } from "react";
import { cx } from "@/lib/format";

/**
 * Imagem de produto com fallback procedural.
 *
 * Se o produto ainda não tem foto (`images` vazio), desenhamos um visual
 * gerado a partir do slug: sempre o mesmo para o mesmo produto, dentro da
 * paleta da marca e com cara de render 3D. Assim a loja fica apresentável
 * antes das fotos reais chegarem — é só preencher `images` depois.
 */

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const palettes = [
  ["#1e4370", "#0a1424", "#38d8f5"],
  ["#2b6198", "#070d18", "#7fe9ff"],
  ["#143050", "#05090f", "#4a8fd0"],
  ["#0e1e33", "#12293f", "#c3d2e2"],
];

export default function ProductImage({
  src,
  alt,
  seed,
  priority,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  recorta = false,
  respiro = "p-3",
}: {
  src?: string;
  alt: string;
  seed: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  /** Preencher o quadro cortando as bordas. Use só quando a foto for de
   *  ambiente, nunca em peça: cortaria a cabeça do boneco. */
  recorta?: boolean;
  respiro?: string;
}) {
  // O mesmo produto pode aparecer duas vezes na página — na vitrine e em
  // "combina com". Um id vindo do nome da peça se repetiria, e id repetido
  // é HTML inválido. Este vem do React e é único por instância.
  const unico = useId().replace(/:/g, "");

  const art = useMemo(() => {
    const h = hash(seed);
    const [a, b, accent] = palettes[h % palettes.length];
    const shape = h % 4;
    const rot = (h % 30) - 15;
    return { a, b, accent, shape, rot };
  }, [seed]);

  if (src) {
    // A peça aparece inteira por padrão. Preencher o quadro cortando as bordas
    // é bonito em foto de ambiente e desastroso em foto de produto: um boneco
    // em pé numa moldura quadrada perde a cabeça e os pés.
    return (
      <>
        {/* A própria foto, borrada, preenche o vazio das laterais. Assim a peça
            não fica boiando numa faixa preta, e a cor do fundo acompanha ela. */}
        {!recorta && (
          <Image
            src={src}
            alt=""
            aria-hidden
            fill
            // Esta camada é borrada e fica a 25% de opacidade: ninguém enxerga
            // detalhe nela. Pedia a foto no tamanho cheio e em outra qualidade
            // da foto nítida, então cada produto era baixado duas vezes — na
            // vitrine isso era 43% dos bytes de imagem indo para um borrão.
            sizes="64px"
            quality={40}
            className="scale-110 object-cover opacity-25 blur-2xl"
          />
        )}
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={90}
          className={cx(
            "relative",
            recorta ? "object-cover" : `object-contain ${respiro}`,
            className,
          )}
        />
      </>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cx("absolute inset-0 overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 100% at 30% 20%, ${art.a} 0%, ${art.b} 70%)`,
      }}
    >
      {/* grade técnica */}
      <div className="bg-grid absolute inset-0 opacity-60" />

      {/* peça 3D estilizada */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        style={{ transform: `rotate(${art.rot * 0.15}deg)` }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`g-${unico}`} x1="40" y1="30" x2="160" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".22" />
            <stop offset=".5" stopColor={art.accent} stopOpacity=".35" />
            <stop offset="1" stopColor="#000000" stopOpacity=".35" />
          </linearGradient>
          <linearGradient id={`s-${unico}`} x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={art.accent} stopOpacity=".55" />
            <stop offset="1" stopColor={art.accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {art.shape === 0 && (
          <>
            <path d="M100 40 155 72v64l-55 32-55-32V72z" fill={`url(#g-${unico})`} stroke={art.accent} strokeOpacity=".5" />
            <path d="M100 40v64l55-32M100 104v64M100 104 45 72" stroke={art.accent} strokeOpacity=".35" fill="none" />
          </>
        )}
        {art.shape === 1 && (
          <>
            <ellipse cx="100" cy="150" rx="42" ry="12" fill={art.accent} fillOpacity=".18" />
            <path d="M78 56c-14 30-18 62 0 94h44c18-32 14-64 0-94z" fill={`url(#g-${unico})`} stroke={art.accent} strokeOpacity=".5" />
            <path d="M74 84h52M72 108h56M76 132h48" stroke={art.accent} strokeOpacity=".28" />
          </>
        )}
        {art.shape === 2 && (
          <>
            <path d="M60 132 100 48l40 84z" fill={`url(#g-${unico})`} stroke={art.accent} strokeOpacity=".5" />
            <rect x="70" y="132" width="60" height="22" rx="4" fill={art.accent} fillOpacity=".14" stroke={art.accent} strokeOpacity=".4" />
            <path d="M100 48v84" stroke={art.accent} strokeOpacity=".3" />
          </>
        )}
        {art.shape === 3 && (
          <>
            <circle cx="100" cy="100" r="46" fill={`url(#g-${unico})`} stroke={art.accent} strokeOpacity=".5" />
            <circle cx="100" cy="100" r="20" fill="none" stroke={art.accent} strokeOpacity=".45" />
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={i}
                x="96"
                y="40"
                width="8"
                height="16"
                rx="2"
                fill={art.accent}
                fillOpacity=".35"
                transform={`rotate(${i * 45} 100 100)`}
              />
            ))}
          </>
        )}

        {/* linhas de camada */}
        <rect x="0" y="0" width="200" height="200" fill={`url(#s-${unico})`} opacity=".25" />
      </svg>

      <div className="bg-layers absolute inset-0 opacity-70" />
    </div>
  );
}
