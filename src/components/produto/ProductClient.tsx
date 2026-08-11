"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { resolvePrice } from "@/data/products";
import { brl, cx } from "@/lib/format";
import { useCart, buildKey } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { whatsappLink } from "@/lib/site";
import ProductImage from "@/components/ProductImage";
import Stars from "@/components/Stars";

const tabs = [
  { id: "descricao", label: "Descrição" },
  { id: "especificacoes", label: "Especificações" },
  { id: "entrega", label: "Produção e envio" },
] as const;

export default function ProductClient({ product }: { product: Product }) {
  const { add, openCart } = useCart();
  const toast = useToast();

  // Primeira opção de cada variação já vem selecionada.
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0].label])),
  );
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("descricao");

  const unitPrice = useMemo(
    () => resolvePrice(product, selected),
    [product, selected],
  );

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const outOfStock = product.stock <= 0;

  const addToCart = () => {
    add({
      key: buildKey(product.id, selected),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitPrice,
      quantity,
      options: selected,
      image: product.images[0],
    });
    toast({
      title: "Adicionado ao carrinho",
      description: `${quantity}× ${product.name}`,
    });
    openCart();
  };

  // Miniaturas: usa as fotos reais quando existirem, senão gera 4 variações.
  const gallery = product.images.length > 0 ? product.images : [0, 1, 2, 3];

  return (
    <>
      <div className="container-x grid gap-10 pb-16 lg:grid-cols-2 lg:gap-16">
        {/* Galeria */}
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="glass border-glow group relative aspect-square overflow-hidden rounded-3xl">
            <ProductImage
              src={product.images[imageIndex]}
              alt={product.name}
              seed={`${product.slug}-${imageIndex}`}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {discount > 0 && (
                <span className="rounded-full bg-cyan-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
                  -{discount}%
                </span>
              )}
              {product.isNew && (
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
                  Novo
                </span>
              )}
            </div>

            <span className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-3 py-1.5 text-[10px] uppercase tracking-wider text-silver-200 backdrop-blur">
              Imagem ilustrativa
            </span>
          </div>

          {/* Miniaturas */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setImageIndex(i)}
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={i === imageIndex}
                className={cx(
                  "relative aspect-square overflow-hidden rounded-xl border transition-all duration-300",
                  i === imageIndex
                    ? "border-cyan-400 shadow-glow"
                    : "border-white/10 opacity-60 hover:opacity-100",
                )}
              >
                <ProductImage
                  src={product.images[i]}
                  alt=""
                  seed={`${product.slug}-${i}`}
                  sizes="120px"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Informações */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Stars rating={product.rating} size={14} />
            <span className="text-xs text-silver-400">
              {product.reviews} avaliações
            </span>
            {product.bestSeller && (
              <span className="rounded-full border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
                Mais vendido
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white lg:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-silver-400">
            {product.shortDescription}
          </p>

          {/* Preço */}
          <div className="mt-8 flex flex-wrap items-end gap-3">
            {product.compareAtPrice && (
              <span className="text-lg text-muted line-through tabular-nums">
                {brl(product.compareAtPrice)}
              </span>
            )}
            <span className="font-display text-4xl font-bold text-white tabular-nums">
              {brl(unitPrice)}
            </span>
            {unitPrice !== product.price && (
              <span className="pb-1.5 text-xs text-cyan-400">
                com as opções escolhidas
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-silver-400">
            ou <strong className="text-white">12x de {brl(unitPrice / 12)}</strong>{" "}
            sem juros · <span className="text-cyan-400">5% off no Pix</span>
          </p>

          {/* Opções */}
          <div className="mt-9 space-y-7">
            {product.options.map((option) => (
              <fieldset key={option.name}>
                <legend className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {option.name}
                  <span className="ml-2 font-sans text-[11px] font-normal normal-case tracking-normal text-silver-400">
                    {selected[option.name]}
                  </span>
                </legend>

                <div className="mt-3 flex flex-wrap gap-2.5">
                  {option.values.map((value) => {
                    const active = selected[option.name] === value.label;
                    return (
                      <button
                        key={value.label}
                        onClick={() =>
                          setSelected((prev) => ({
                            ...prev,
                            [option.name]: value.label,
                          }))
                        }
                        aria-pressed={active}
                        className={cx(
                          "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all duration-300",
                          active
                            ? "border-cyan-400 bg-cyan-400/10 text-white"
                            : "border-white/12 text-silver-400 hover:border-white/25 hover:text-white",
                        )}
                      >
                        {value.hex && (
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-white/25"
                            style={{ background: value.hex }}
                            aria-hidden
                          />
                        )}
                        {value.label}
                        {!!value.priceDelta && value.priceDelta > 0 && (
                          <span className="text-[11px] text-cyan-400">
                            +{brl(value.priceDelta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {/* Quantidade + comprar */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center justify-between rounded-full border border-white/12 px-2 sm:justify-start">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                className="flex h-11 w-11 items-center justify-center rounded-full text-silver-200 transition-colors hover:bg-white/8"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span className="w-10 text-center font-display font-bold text-white tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock || 99, q + 1))
                }
                aria-label="Aumentar quantidade"
                className="flex h-11 w-11 items-center justify-center rounded-full text-silver-200 transition-colors hover:bg-white/8"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>

            <button
              onClick={addToCart}
              disabled={outOfStock}
              className={cx(
                "group flex flex-1 items-center justify-center gap-2.5 rounded-full px-8 py-4 font-semibold transition-all duration-400",
                outOfStock
                  ? "cursor-not-allowed bg-white/8 text-muted"
                  : "bg-white text-ink hover:bg-cyan-300 hover:shadow-glow",
              )}
            >
              {outOfStock ? (
                "Esgotado"
              ) : (
                <>
                  Adicionar ao carrinho
                  <span className="tabular-nums">
                    · {brl(unitPrice * quantity)}
                  </span>
                </>
              )}
            </button>
          </div>

          <a
            href={whatsappLink(
              `Olá! Tenho interesse no produto "${product.name}". Pode me ajudar?`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/12 py-3.5 text-sm font-medium text-silver-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z" />
            </svg>
            Tirar dúvida sobre esta peça
          </a>

          {/* Garantias */}
          <ul className="mt-8 grid gap-3 border-t border-white/8 pt-8 sm:grid-cols-2">
            {[
              {
                title: `Pronta em ${product.leadTimeDays} dias úteis`,
                body: "Produção começa após a confirmação",
                icon: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
              },
              {
                title: "Frete grátis acima de R$ 299",
                body: "Para todo o Brasil",
                icon: (
                  <>
                    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
                    <circle cx="7" cy="18" r="1.6" />
                    <circle cx="17" cy="18" r="1.6" />
                  </>
                ),
              },
              {
                title: "Trocamos se quebrar no envio",
                body: "É só mandar a foto em até 7 dias",
                icon: (
                  <>
                    <path d="M12 3 5 6v6c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6z" />
                    <path d="m9 12 2 2 4-4" />
                  </>
                ),
              },
              {
                title: "Quer diferente?",
                body: "Personalizamos cor, tamanho e gravação",
                icon: (
                  <>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </>
                ),
              },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-cyan-400">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="block text-xs text-silver-400">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Abas */}
      <div className="container-x pb-20">
        <div className="glass border-glow overflow-hidden rounded-3xl">
          <div
            role="tablist"
            aria-label="Detalhes do produto"
            className="flex overflow-x-auto border-b border-white/8"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cx(
                  "relative shrink-0 px-6 py-4 font-display text-sm font-semibold transition-colors duration-300",
                  tab === item.id
                    ? "text-white"
                    : "text-silver-400 hover:text-white",
                )}
              >
                {item.label}
                <span
                  className={cx(
                    "absolute inset-x-4 bottom-0 h-0.5 origin-left bg-cyan-400 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    tab === item.id ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="p-7 sm:p-10">
            {tab === "descricao" && (
              <div className="max-w-2xl">
                <p className="text-base leading-relaxed text-silver-200">
                  {product.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/loja?q=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-silver-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {tab === "especificacoes" && (
              <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center justify-between border-b border-white/6 pb-3"
                  >
                    <dt className="text-sm text-silver-400">{spec.label}</dt>
                    <dd className="font-display text-sm font-semibold text-white">
                      {spec.value}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between border-b border-white/6 pb-3">
                  <dt className="text-sm text-silver-400">Código</dt>
                  <dd className="font-display text-sm font-semibold text-white">
                    {product.id.toUpperCase()}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b border-white/6 pb-3">
                  <dt className="text-sm text-silver-400">Estoque</dt>
                  <dd className="font-display text-sm font-semibold text-white">
                    {product.stock > 99 ? "Sob demanda" : `${product.stock} un`}
                  </dd>
                </div>
              </dl>
            )}

            {tab === "entrega" && (
              <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Produção
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver-400">
                    Esta peça leva {product.leadTimeDays} dias úteis para ficar
                    pronta. O prazo começa a contar depois da confirmação do
                    pagamento — e, em pedidos personalizados, depois da aprovação
                    da prévia.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Envio
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver-400">
                    Enviamos por Correios e transportadora para todo o Brasil,
                    sempre com código de rastreio. Acima de R$ 299 o frete é por
                    nossa conta.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Cuidados
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver-400">
                    Evite deixar a peça dentro do carro fechado no sol. Para
                    limpar, pano úmido e sabão neutro — nada de solvente.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Trocas
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver-400">
                    Chegou danificada? Manda a foto em até 7 dias que a gente
                    reimprime e reenvia sem custo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
