"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { faixaDePreco, type Category, type Product } from "@/data/products";
import { brl, cx } from "@/lib/format";

type SortKey = "relevancia" | "preco-asc" | "preco-desc" | "nota" | "novidades";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "relevancia", label: "Mais relevantes" },
  { value: "novidades", label: "Lançamentos" },
  { value: "preco-asc", label: "Menor preço" },
  { value: "preco-desc", label: "Maior preço" },
  { value: "nota", label: "Melhor avaliados" },
];

export default function ShopClient({
  products,
  categories,
  initialQuery = "",
  initialCategory = null,
}: {
  products: Product[];
  categories: Category[];
  initialQuery?: string;
  initialCategory?: string | null;
}) {
  const params = useSearchParams();

  // O teto do filtro vem do catálogo que chegou, não de uma constante: com os
  // produtos vindo do Precifica, ele muda conforme você publica.
  const priceRange = useMemo(() => faixaDePreco(products), [products]);

  // O Precifica não coleta avaliação, então "melhor avaliados" só faz sentido
  // enquanto houver nota — caso contrário a opção some da ordenação.
  const temNotas = useMemo(
    () => products.some((p) => typeof p.rating === "number"),
    [products],
  );

  const [query, setQuery] = useState(initialQuery);
  const [activeCategories, setActiveCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [maxPrice, setMaxPrice] = useState(priceRange.max);
  const [sort, setSort] = useState<SortKey>("relevancia");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Reaplica os filtros quando a URL muda (ex.: clicar numa categoria no rodapé
  // já estando na loja). Depende dos valores, não do objeto, para não zerar os
  // filtros que o usuário mexeu na mão.
  const urlQuery = params.get("q");
  const urlCategory = params.get("categoria");

  useEffect(() => {
    setQuery(urlQuery ?? "");
    setActiveCategories(urlCategory ? [urlCategory] : []);
  }, [urlQuery, urlCategory]);

  const filtered = useMemo(() => {
    const normalize = (text: string) =>
      text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

    const q = normalize(query.trim());

    const result = products.filter((product) => {
      if (
        activeCategories.length > 0 &&
        !activeCategories.includes(product.category)
      ) {
        return false;
      }
      if (product.price > maxPrice) return false;
      if (onlyInStock && product.stock <= 0) return false;
      if (onlyPromo && !product.compareAtPrice) return false;

      if (q) {
        const haystack = normalize(
          [
            product.name,
            product.shortDescription,
            product.description,
            ...product.tags,
          ].join(" "),
        );
        // Todas as palavras da busca precisam aparecer em algum campo.
        return q.split(/\s+/).every((word) => haystack.includes(word));
      }
      return true;
    });

    const sorted = [...result];
    switch (sort) {
      case "preco-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "preco-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "nota":
        sorted.sort(
          (a, b) =>
            (b.rating ?? 0) - (a.rating ?? 0) ||
            (b.reviews ?? 0) - (a.reviews ?? 0),
        );
        break;
      case "novidades":
        sorted.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
        break;
      default:
        sorted.sort(
          (a, b) =>
            Number(!!b.featured) - Number(!!a.featured) ||
            (b.reviews ?? 0) - (a.reviews ?? 0),
        );
    }
    return sorted;
  }, [products, query, activeCategories, maxPrice, sort, onlyInStock, onlyPromo]);

  const toggleCategory = (slug: string) =>
    setActiveCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );

  const activeFilterCount =
    activeCategories.length +
    (maxPrice < priceRange.max ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (onlyPromo ? 1 : 0) +
    (query ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setActiveCategories([]);
    setMaxPrice(priceRange.max);
    setOnlyInStock(false);
    setOnlyPromo(false);
    setSort("relevancia");
  };

  // Recebe um prefixo porque este painel é montado duas vezes: fixo na
  // lateral no computador e dentro da gaveta no celular. Com id fixo, os
  // dois campos ficavam com o mesmo id na página, e o rótulo do segundo
  // deixava de apontar para o campo dele — tocar em "Buscar" no celular não
  // levava o foco para lugar nenhum.
  const filtersPanel = (prefixo: string) => (
    <div className="space-y-8">
      {/* Busca */}
      <div>
        <label
          htmlFor={`${prefixo}-shop-search`}
          className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white"
        >
          Buscar
        </label>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2.5 transition-colors focus-within:border-cyan-400/50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id={`${prefixo}-shop-search`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome, tipo, tag…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="shrink-0 text-muted transition-colors hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Categorias */}
      <fieldset>
        <legend className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
          Categorias
        </legend>
        <div className="mt-3 space-y-1">
          {/* Categorias com destino próprio (ex.: "Sob medida") não são
              prateleira da loja, então ficam fora dos filtros. */}
          {categories
            .filter((category) => !category.href)
            .map((category) => {
            const count = products.filter(
              (p) => p.category === category.slug,
            ).length;
            const active = activeCategories.includes(category.slug);
            return (
              <label
                key={category.slug}
                className={cx(
                  "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-cyan-400/10 text-white"
                    : "text-silver-400 hover:bg-white/4 hover:text-white",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cx(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      active
                        ? "border-cyan-400 bg-cyan-400 text-ink"
                        : "border-white/20",
                    )}
                  >
                    {active && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleCategory(category.slug)}
                    className="sr-only"
                  />
                  {category.name}
                </span>
                <span className="text-[11px] text-muted tabular-nums">{count}</span>
                </label>
              );
            })}
        </div>
      </fieldset>

      {/* Preço */}
      <div>
        <div className="flex items-baseline justify-between">
          <label
            htmlFor={`${prefixo}-price-range`}
            className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white"
          >
            Preço até
          </label>
          <span className="font-display text-sm font-bold text-cyan-400 tabular-nums">
            {brl(maxPrice)}
          </span>
        </div>
        <input
          id={`${prefixo}-price-range`}
          type="range"
          min={50}
          max={priceRange.max}
          step={10}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="mt-4 w-full accent-cyan-400"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>{brl(50)}</span>
          <span>{brl(priceRange.max)}</span>
        </div>
      </div>

      {/* Extras */}
      <fieldset>
        <legend className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
          Filtros rápidos
        </legend>
        <div className="mt-3 space-y-2">
          {[
            { label: "Somente em estoque", value: onlyInStock, set: setOnlyInStock },
            { label: "Somente em promoção", value: onlyPromo, set: setOnlyPromo },
          ].map((toggle) => (
            <label
              key={toggle.label}
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-silver-400 transition-colors hover:text-white"
            >
              {toggle.label}
              <button
                type="button"
                role="switch"
                aria-checked={toggle.value}
                aria-label={toggle.label}
                onClick={() => toggle.set(!toggle.value)}
                className={cx(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300",
                  toggle.value ? "bg-cyan-400" : "bg-white/12",
                )}
              >
                <span
                  className={cx(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    toggle.value ? "translate-x-4.5" : "translate-x-0.5",
                  )}
                />
              </button>
            </label>
          ))}
        </div>
      </fieldset>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full rounded-xl border border-white/12 py-2.5 text-sm text-silver-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
        >
          Limpar filtros ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="container-x grid gap-10 pb-24 lg:grid-cols-[16rem_1fr] lg:gap-12">
      {/* Filtros — desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-h)+1.5rem)]">
          {filtersPanel("lateral")}
        </div>
      </aside>

      {/* Resultados */}
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-silver-400">
            <strong className="text-white tabular-nums">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "produto" : "produtos"}
            {query && (
              <>
                {" "}
                para <span className="text-cyan-400">“{query}”</span>
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-xs font-medium text-silver-200 transition-colors hover:border-cyan-400/40 lg:hidden"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filtros
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-cyan-400 px-1.5 text-[10px] font-bold text-ink">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <label className="sr-only" htmlFor="sort">
              Ordenar por
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-white/12 bg-navy-950 px-4 py-2 text-xs text-silver-200 outline-none transition-colors hover:border-cyan-400/40 focus:border-cyan-400/60"
            >
              {sortOptions
                .filter((o) => o.value !== "nota" || temNotas)
                .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass flex flex-col items-center gap-4 rounded-2xl py-20 text-center">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-silver-400">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-display text-lg text-white">
                Nada por aqui com esses filtros
              </p>
              <p className="mt-1 text-sm text-silver-400">
                Tente afrouxar o preço ou tirar alguma categoria.
              </p>
            </div>
            <button
              onClick={clearAll}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cyan-300"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={i < 3}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filtros — mobile */}
      <div
        className={cx(
          "fixed inset-0 z-[85] lg:hidden",
          filtersOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setFiltersOpen(false)}
          className={cx(
            "absolute inset-0 bg-ink/75 backdrop-blur-sm transition-opacity duration-400",
            filtersOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cx(
            "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-navy-950 p-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            filtersOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">Filtros</h2>
            <button
              onClick={() => setFiltersOpen(false)}
              aria-label="Fechar filtros"
              className="flex h-9 w-9 items-center justify-center rounded-full text-silver-400 hover:bg-white/5 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {filtersPanel("gaveta")}

          <button
            onClick={() => setFiltersOpen(false)}
            className="mt-8 w-full rounded-full bg-white py-3.5 font-semibold text-ink"
          >
            Ver {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
          </button>
        </div>
      </div>
    </div>
  );
}
