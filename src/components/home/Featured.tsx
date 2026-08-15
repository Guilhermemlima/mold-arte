import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { getFeaturedProducts } from "@/data/products";

export default async function Featured() {
  const featured = await getFeaturedProducts();

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div
        className="absolute left-1/2 top-1/4 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-steel-600/10 blur-[130px]"
        aria-hidden
      />

      <div className="container-x relative">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
              <span className="h-px w-10 bg-cyan-400" />
              Seleção da casa
            </p>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Saiu da <span className="text-gradient">impressora agora</span>
            </h2>
          </div>
          <Link
            href="/loja"
            className="group inline-flex shrink-0 items-center gap-2 py-2 text-sm font-semibold text-silver-200 transition-colors hover:text-cyan-400"
          >
            Ver catálogo completo
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </Reveal>

        <Reveal
          stagger={0.09}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 3} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
