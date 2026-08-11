"use client";

import Link from "next/link";
import { useCart, precoUnitario } from "@/context/CartContext";
import { brl } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import OrderSummary from "@/components/checkout/OrderSummary";

export default function CartPageClient() {
  const { items, remove, setQty, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-x pb-28">
        <div className="glass border-glow flex flex-col items-center gap-5 rounded-3xl py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-silver-400">
              <path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8z" />
              <path d="M9 7a3 3 0 1 1 6 0" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Ainda não tem nada aqui
            </h2>
            <p className="mt-2 text-sm text-silver-400">
              Dá uma olhada no catálogo — tem peça saindo da impressora agora.
            </p>
          </div>
          <Link
            href="/loja"
            className="rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
          >
            Ver a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x grid gap-10 pb-28 lg:grid-cols-[1fr_22rem] lg:gap-14">
      {/* Itens */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-silver-400">
            <strong className="text-white">{items.length}</strong>{" "}
            {items.length === 1 ? "produto" : "produtos"} no carrinho
          </p>
          <button
            onClick={clear}
            className="text-xs text-silver-400 transition-colors hover:text-red-400"
          >
            Esvaziar carrinho
          </button>
        </div>

        <ul className="glass border-glow divide-y divide-white/6 rounded-2xl px-5">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col gap-4 py-6 sm:flex-row">
              <Link
                href={`/produto/${item.slug}`}
                className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/8"
              >
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  seed={item.slug}
                  sizes="112px"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/produto/${item.slug}`}
                      className="font-display text-base font-semibold text-white transition-colors hover:text-cyan-400"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => remove(item.key)}
                      aria-label={`Remover ${item.name}`}
                      className="shrink-0 text-silver-400 transition-colors hover:text-red-400"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
                      </svg>
                    </button>
                  </div>

                  {Object.entries(item.options).length > 0 && (
                    <p className="mt-1.5 text-xs text-muted">
                      {Object.entries(item.options)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-silver-400">
                    {precoUnitario(item) < item.unitPrice ? (
                      <>
                        <span className="text-muted line-through">
                          {brl(item.unitPrice)}
                        </span>{" "}
                        <span className="text-cyan-400">
                          {brl(precoUnitario(item))} cada
                        </span>{" "}
                        — desconto por quantidade
                      </>
                    ) : (
                      `${brl(item.unitPrice)} cada`
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-white/12">
                    <button
                      onClick={() => setQty(item.key, item.quantity - 1)}
                      aria-label="Diminuir quantidade"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-silver-200 transition-colors hover:bg-white/8"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="w-9 text-center text-sm font-semibold text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQty(item.key, item.quantity + 1)}
                      aria-label="Aumentar quantidade"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-silver-200 transition-colors hover:bg-white/8"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>

                  <span className="font-display text-lg font-bold text-white tabular-nums">
                    {brl(precoUnitario(item) * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/loja"
          className="mt-6 inline-flex items-center gap-2 text-sm text-silver-400 transition-colors hover:text-cyan-400"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Continuar comprando
        </Link>
      </div>

      {/* Resumo */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <OrderSummary
          action={
            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
            >
              Ir para o pagamento
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          }
        />
      </aside>
    </div>
  );
}
