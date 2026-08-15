import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getCategories } from "@/data/products";

const icons: Record<string, React.ReactNode> = {
  deco: (
    <path d="M9 4h6l1 5c1.5 2 2 4 2 6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5c0-2 .5-4 2-6z" />
  ),
  light: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v1h6v-1c0-.4.1-.8.5-1.1A6 6 0 0 0 12 3z" />
    </>
  ),
  collect: (
    <>
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9z" />
      <path d="M12 12 4 7.5M12 12v9M12 12l8-4.5" />
    </>
  ),
  tech: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M18.4 5.6l-2 2M7.6 16.4l-2 2M18.4 18.4l-2-2M7.6 7.6l-2-2" />
    </>
  ),
  gift: (
    <>
      <path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M3 7h18v4H3zM12 7v14" />
      <path d="M12 7S9.5 3 7.5 4.5 9 7 12 7zM12 7s2.5-4 4.5-2.5S15 7 12 7z" />
    </>
  ),
  custom: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
};

export default async function Categories() {
  const categories = await getCategories();

  return (
    <section className="relative overflow-hidden py-20 lg:py-28" id="categorias">
      <div className="container-x">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
              <span className="h-px w-10 bg-cyan-400" />
              Navegue
            </p>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              O que você quer{" "}
              <span className="text-gradient">materializar</span> hoje?
            </h2>
          </div>
          <Link
            href="/loja"
            className="group inline-flex shrink-0 items-center gap-2 py-2 text-sm font-semibold text-silver-200 transition-colors hover:text-cyan-400"
          >
            Ver tudo
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </Reveal>

        <Reveal
          stagger={0.08}
          from="scale"
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((category, i) => (
            <Link
              key={category.slug}
              href={category.href ?? `/loja?categoria=${category.slug}`}
              className="glass border-glow group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-card"
            >
              {/* Brilho no hover */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/0 blur-3xl transition-colors duration-700 group-hover:bg-cyan-400/20" />

              <div className="relative flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-cyan-400 transition-all duration-500 group-hover:border-cyan-400/40 group-hover:text-cyan-300">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {icons[category.icon]}
                  </svg>
                </span>
                <span className="font-display text-xs text-muted tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="relative mt-6 font-display text-xl font-bold text-white">
                {category.name}
              </h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-silver-400">
                {category.description}
              </p>

              <span className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 opacity-0 transition-all duration-400 group-hover:opacity-100">
                Ver produtos
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
