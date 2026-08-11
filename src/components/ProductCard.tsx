"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";
import type { Product } from "@/data/products";
import { brl, cx } from "@/lib/format";
import { useCart, buildKey } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import ProductImage from "./ProductImage";
import Stars from "./Stars";

export default function ProductCard({
  product,
  priority,
}: {
  product: Product;
  priority?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { add, openCart } = useCart();
  const toast = useToast();

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  // Inclinação 3D acompanhando o mouse.
  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    gsap.to(el, {
      rotateY: px * 9,
      rotateX: -py * 9,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 900,
      transformOrigin: "center",
    });
  };

  const onLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.6)",
    });
  };

  // Adiciona com a primeira opção de cada variação já escolhida.
  const quickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    const options = Object.fromEntries(
      product.options.map((o) => [o.name, o.values[0].label]),
    );
    const extra = product.options.reduce(
      (sum, o) => sum + (o.values[0].priceDelta ?? 0),
      0,
    );

    add({
      key: buildKey(product.id, options),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitPrice: product.price + extra,
      quantity: 1,
      options,
      image: product.images[0],
    });

    toast({
      title: "Adicionado ao carrinho",
      description: product.name,
    });
    openCart();
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative will-change-transform"
      style={{ transformStyle: "preserve-3d" }}
    >
      <Link
        href={`/produto/${product.slug}`}
        className="glass border-glow block overflow-hidden rounded-2xl transition-shadow duration-500 hover:shadow-card"
      >
        {/* Imagem */}
        <div className="relative aspect-square overflow-hidden bg-navy-950">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            seed={product.slug}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Brilho que atravessa no hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full" />

          {/* Selos */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {discount > 0 && (
              <span className="rounded-full bg-cyan-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
                -{discount}%
              </span>
            )}
            {product.isNew && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
                Novo
              </span>
            )}
            {product.bestSeller && (
              <span className="glass rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-300">
                Mais vendido
              </span>
            )}
          </div>

          {product.stock <= 10 && product.stock > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-medium text-silver-200 backdrop-blur">
              Últimas {product.stock}
            </span>
          )}

          {/* Ação rápida — peça sob consulta não entra no carrinho */}
          {!product.sobConsulta && (
            <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
              <button
                onClick={quickAdd}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-xs font-bold text-ink backdrop-blur transition-colors hover:bg-cyan-300"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Adicionar rápido
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          {typeof product.rating === "number" && (
            <div className="flex items-center justify-between gap-2">
              <Stars rating={product.rating} />
              {typeof product.reviews === "number" && (
                <span className="text-[10px] text-muted">
                  {product.reviews} avaliações
                </span>
              )}
            </div>
          )}

          <h3 className="mt-2 font-display text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-cyan-300">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-silver-400">
            {product.shortDescription}
          </p>

          <div className="mt-3.5 flex items-end justify-between gap-2">
            <div>
              {product.compareAtPrice && (
                <span className="block text-[11px] text-muted line-through tabular-nums">
                  {brl(product.compareAtPrice)}
                </span>
              )}
              <span className="font-display text-lg font-bold text-white tabular-nums">
                {product.sobConsulta ? (
                  <span className="text-cyan-300">Sob consulta</span>
                ) : (
                  brl(product.price)
                )}
              </span>
            </div>
            <span
              className={cx(
                "flex items-center gap-1 text-[10px]",
                product.stock > 0 ? "text-silver-400" : "text-red-400",
              )}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {product.leadTimeDays}d
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
