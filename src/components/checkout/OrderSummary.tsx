"use client";

import { useState, type ReactNode } from "react";
import { useCart } from "@/context/CartContext";
import { brl } from "@/lib/format";
import { descontoDoPix, rotuloDoPix } from "@/lib/pagamento";
import { site } from "@/lib/site";

/** Resumo do pedido — usado no carrinho e no checkout. */
export default function OrderSummary({
  action,
  compact = false,
  pagamento,
}: {
  action?: ReactNode;
  compact?: boolean;
  /**
   * Forma de pagamento já escolhida, quando existe uma.
   *
   * No carrinho ainda não existe: lá o Pix aparece como possibilidade, com o
   * valor que ele daria. No checkout, depois de escolhida, ela entra na conta
   * do total — porque é esse total que o banco vai gravar e o Asaas cobrar.
   */
  pagamento?: string | null;
}) {
  const {
    items,
    subtotal,
    shipping,
    discount,
    total: finalTotal,
    cupom,
    aplicaCupom,
    missingForFreeShipping,
    freeShippingProgress,
  } = useCart();

  // A mesma conta do banco: sobre a mercadoria já com o cupom, sem o frete.
  const abatePix = site.descontoPix > 0 ? descontoDoPix(subtotal, discount) : 0;
  const ehPix = String(pagamento ?? "").toLowerCase() === "pix";
  const totalNaTela = Math.max(0, finalTotal - (ehPix ? abatePix : 0));

  const [coupon, setCoupon] = useState("");
  const [conferindo, setConferindo] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);

  // Quem decide se o cupom vale é o banco. A tela só mostra o resultado —
  // conferir aqui no navegador não seguraria ninguém.
  const applyCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (conferindo || !coupon.trim()) return;

    setConferindo(true);
    setRecado(null);

    try {
      const r = await fetch("/api/cupom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: coupon.trim(), subtotal }),
      });
      const dados = await r.json();

      if (dados.ok) {
        aplicaCupom({
          codigo: dados.codigo,
          tipo: dados.tipo,
          valor: Number(dados.valor) || 0,
          descricao: dados.descricao,
        });
        setCoupon("");
      } else {
        aplicaCupom(null);
        setRecado(dados.recado ?? "Cupom inválido.");
      }
    } catch {
      setRecado("Não consegui conferir o cupom agora.");
    } finally {
      setConferindo(false);
    }
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
      {cupom ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-cyan-400/25 bg-cyan-400/5 px-4 py-3">
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-cyan-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
              {cupom.codigo}
            </span>
            <span className="mt-0.5 block text-xs text-silver-400">
              {cupom.descricao ||
                (cupom.tipo === "frete"
                  ? "Frete grátis"
                  : cupom.tipo === "percentual"
                    ? `${cupom.valor}% de desconto`
                    : `${brl(cupom.valor)} de desconto`)}
            </span>
          </span>
          <button
            onClick={() => aplicaCupom(null)}
            className="shrink-0 text-xs text-silver-400 transition-colors hover:text-red-400"
          >
            Remover
          </button>
        </div>
      ) : (
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
              disabled={conferindo}
              className="shrink-0 rounded-xl border border-white/12 px-4 text-sm font-medium text-silver-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
            >
              {conferindo ? "…" : "Aplicar"}
            </button>
          </div>
          {recado && <p className="mt-2 text-xs text-red-400">{recado}</p>}
        </form>
      )}

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
              <span className="text-cyan-400">
                Grátis{cupom?.tipo === "frete" && " (cupom)"}
              </span>
            ) : (
              brl(shipping)
            )}
          </dd>
        </div>
        {ehPix && abatePix > 0 && (
          <div className="flex justify-between text-cyan-400">
            <dt>Desconto no Pix ({site.descontoPix}%)</dt>
            <dd className="tabular-nums">-{brl(abatePix)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-white/8 pt-4 font-display text-xl font-bold text-white">
          <dt>Total</dt>
          <dd className="tabular-nums">{brl(totalNaTela)}</dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-silver-400">
        em até 12x de {brl(Math.max(0, finalTotal) / 12)} sem juros
      </p>
      {/* Já escolhido o Pix, o desconto está no total acima: repetir aqui
          faria parecer que ainda há mais 5% para descontar. */}
      {abatePix > 0 && !ehPix && (
        <p className="mt-0.5 text-xs text-cyan-400">
          {brl(Math.max(0, finalTotal - abatePix))} à vista — {rotuloDoPix}
        </p>
      )}

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
