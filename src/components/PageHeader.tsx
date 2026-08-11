import Link from "next/link";
import Reveal from "./Reveal";

type Crumb = { label: string; href?: string };

/** Cabeçalho padrão das páginas internas: migalhas, título e subtítulo. */
export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
}: {
  eyebrow?: string;
  /** Quando vazio, a página cuida do próprio <h1> (caso das páginas de produto). */
  title?: string;
  description?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <section className="relative overflow-hidden pb-12 pt-12 lg:pb-16 lg:pt-16">
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
      <div
        className="absolute -top-32 left-1/4 h-72 w-[38rem] rounded-full bg-steel-600/20 blur-[120px]"
        aria-hidden
      />

      <div className="container-x relative">
        {/* Migalhas */}
        <nav aria-label="Você está em" className="mb-7">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-cyan-400">
                Início
              </Link>
            </li>
            {breadcrumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-cyan-400"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-silver-200">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {(eyebrow || title || description) && (
          <Reveal>
            {eyebrow && (
              <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
                <span className="h-px w-10 bg-cyan-400" />
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-silver-400">
                {description}
              </p>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
