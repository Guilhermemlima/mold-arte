"use client";

import { useState, type ReactNode } from "react";
import { useCart } from "@/context/CartContext";
import { brl } from "@/lib/format";

/** Resumo do pedido — usado no carrinho e no checkout. */
export default function OrderSummary({
  action,
  compact = false,
}: {
  action?: ReactNode;
  compact?: boolean;
}) {
  const { items, subtotal, shipping, total, missingForFreeShipping, freeShippingProgress } =
    useCart();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  // Cupom de exemplo. Troque pela validação real do seu backend.
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const finalTotal = total - discount;

  const applyCoupon = (event: React.FormEvent) => {
    event.preventDefault();
    setCouponApplied(coupon.trim().toUpperCase() === "MOLDARTE10");
  };

  return (
    <div className="glass border-glow rounded-2xl p-6">
      <h2 className="font-display text-lg font-bold text-white">
        Resumo do pedido
      </h2>

      {compact && (
        <ul className="mt-4 space-y-2.5 border-b border-white/8 pb-4">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <span className="min-w-0 text-silver-400">
                <span className="text-white">{item.quantity}×</span> {item.name}
              </span>
              <span className="shrink-0 text-silver-200 tabular-nums">
                {brl(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Frete grátis */}
      {missingForFreeShipping > 0 && items.length > 0 && (
        <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3.5">
          <p className="text-xs text-silver-200">
            Faltam{" "}
            <strong className="text-cyan-400">
              {brl(missingForFreeShipping)}
            </strong>{" "}
            para o frete sair de graça
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-steel-500 to-cyan-400 transition-[width] duration-700"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Cupom */}
      <form onSubmit={applyCoupon} className="mt-5">
        <label htmlFor="coupon" className="sr-only">
          Cupom de desconto
        </label>
        <div className="flex gap-2">
          <input
            id="coupon"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Cupom de desconto"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-sm text-white uppercase outline-none transition-colors placeholder:normal-case placeholder:text-muted focus:border-cyan-400/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-white/12 px-4 text-sm font-medium text-silver-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Aplicar
          </button>
        </div>
        {couponApplied && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
            Cupom aplicado: 10% de desconto
          </p>
        )}
      </form>

      {/* Totais */}
      <dl className="mt-6 space-y-2.5 border-t border-white/8 pt-5 text-sm">
        <div className="flex justify-between text-silver-400">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{brl(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-cyan-400">
            <dt>Desconto</dt>
            <dd className="tabular-nums">-{brl(discount)}</dd>
          </div>
        )}
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
        <div className="flex items-baseline justify-between border-t border-white/8 pt-4 font-display text-xl font-bold text-white">
          <dt>Total</dt>
          <dd className="tabular-nums">{brl(Math.max(0, finalTotal))}</dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-silver-400">
        em até 12x de {brl(Math.max(0, finalTotal) / 12)} sem juros
      </p>
      <p className="mt-0.5 text-xs text-cyan-400">
        {brl(Math.max(0, finalTotal) * 0.95)} à vista no Pix (5% off)
      </p>

      {action}

      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-cyan-400">
          <path d="M12 3 5 6v6c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6z" />
          <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Ambiente seguro · seus dados são criptografados
      </div>
    </div>
  );
}
