"use client";

import Link from "next/link";
import { useCart, precoUnitario } from "@/context/CartContext";
import { brl, cx } from "@/lib/format";
import { site } from "@/lib/site";
import ProductImage from "./ProductImage";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    remove,
    setQty,
    subtotal,
    shipping,
    total,
    freeShippingProgress,
    missingForFreeShipping,
    count,
  } = useCart();

  return (
    <div
      className={cx(
        "fixed inset-0 z-[90]",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!isOpen}
    >
      {/* Fundo */}
      <div
        onClick={closeCart}
        className={cx(
          "absolute inset-0 bg-ink/75 backdrop-blur-sm transition-opacity duration-500",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Painel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={cx(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-navy-950 shadow-card transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Seu carrinho
            </h2>
            <p className="mt-0.5 text-xs text-silver-400">
              {count} {count === 1 ? "item" : "itens"}
            </p>
          </div>
          <button
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="flex h-9 w-9 items-center justify-center rounded-full text-silver-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barra de frete grátis */}
        {items.length > 0 && (
          <div className="border-b border-white/10 px-6 py-4">
            {missingForFreeShipping > 0 ? (
              <p className="text-xs text-silver-400">
                Faltam{" "}
                <strong className="text-cyan-400">
                  {brl(missingForFreeShipping)}
                </strong>{" "}
                para o frete grátis
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4 4L19 7" />
                </svg>
                Frete grátis liberado
              </p>
            )}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-steel-500 to-cyan-400 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Itens */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="glass flex h-20 w-20 items-center justify-center rounded-2xl">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-silver-400">
                  <path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8z" />
                  <path d="M9 7a3 3 0 1 1 6 0" />
                </svg>
              </div>
              <div>
                <p className="font-display text-lg text-white">
                  Seu carrinho está vazio
                </p>
                <p className="mt-1 text-sm text-silver-400">
                  Que tal começar pelos mais vendidos?
                </p>
              </div>
              <Link
                href="/loja"
                onClick={closeCart}
                className="mt-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cyan-300"
              >
                Ver a loja
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <Link
                    href={`/produto/${item.slug}`}
                    onClick={closeCart}
                    className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/8"
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      seed={item.slug}
                      sizes="80px"
                      respiro="p-1"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/produto/${item.slug}`}
                        onClick={closeCart}
                        className="text-sm font-semibold leading-snug text-white transition-colors hover:text-cyan-400"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => remove(item.key)}
                        aria-label={`Remover ${item.name}`}
                        className="shrink-0 text-silver-400 transition-colors hover:text-red-400"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
                        </svg>
                      </button>
                    </div>

                    {Object.entries(item.options).length > 0 && (
                      <p className="mt-1 text-[11px] text-muted">
                        {Object.entries(item.options)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-white/12">
                        <button
                          onClick={() => setQty(item.key, item.quantity - 1)}
                          aria-label="Diminuir quantidade"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-silver-200 transition-colors hover:bg-white/8"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M5 12h14" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setQty(item.key, item.quantity + 1)}
                          aria-label="Aumentar quantidade"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-silver-200 transition-colors hover:bg-white/8"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                      <span className="text-right">
                        {precoUnitario(item) < item.unitPrice && (
                          <span className="block text-[10px] text-cyan-400">
                            {brl(precoUnitario(item))} cada
                          </span>
                        )}
                        <span className="text-sm font-bold text-white tabular-nums">
                          {brl(precoUnitario(item) * item.quantity)}
                        </span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rodapé */}
        {items.length > 0 && (
          <div className="border-t border-white/10 bg-navy-900/60 px-6 py-5">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-silver-400">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{brl(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-silver-400">
                <dt>Frete</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? (
                    <span className="text-cyan-400">Grátis</span>
                  ) : (
                    brl(shipping)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2.5 font-display text-lg font-bold text-white">
                <dt>Total</dt>
                <dd className="tabular-nums">{brl(total)}</dd>
              </div>
            </dl>

            <p className="mt-2 text-center text-[11px] text-muted">
              ou 12x de {brl(total / 12)} no cartão
            </p>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
            >
              Finalizar compra
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <button
              onClick={closeCart}
              className="mt-2 w-full py-2 text-xs text-silver-400 transition-colors hover:text-white"
            >
              Continuar comprando
            </button>

            <p className="mt-3 text-center text-[10px] text-muted">
              Prazo de produção conforme cada peça · Envio de {site.contact.city}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
