"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Logo from "./Logo";
import Magnetic from "./Magnetic";
import { useCart } from "@/context/CartContext";
import { navLinks } from "@/lib/site";
import { cx } from "@/lib/format";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, openCart } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const lastY = useRef(0);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Header encolhe ao rolar e se esconde quando o usuário desce rápido.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 320 && y > lastY.current && !menuOpen && !searchOpen);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen, searchOpen]);

  // Pulso no contador quando um item entra no carrinho.
  useEffect(() => {
    if (!badgeRef.current || count === 0) return;
    gsap.fromTo(
      badgeRef.current,
      { scale: 0.4 },
      { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.5)" },
    );
  }, [count]);

  // Fecha tudo ao trocar de página.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Trava o scroll com o menu mobile aberto.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Ctrl/Cmd+K abre a busca; Esc fecha.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    router.push(q ? `/loja?q=${encodeURIComponent(q)}` : "/loja");
  };

  return (
    <>
      {/* Faixa de aviso */}
      <div className="relative z-50 overflow-hidden border-b border-white/5 bg-navy-950">
        <div className="container-x flex h-9 items-center justify-center gap-2 text-[11px] tracking-wide text-silver-400">
          <span className="hidden h-1.5 w-1.5 rounded-full bg-cyan-400 sm:block" />
          <p>
            Frete grátis acima de{" "}
            <strong className="text-white">R$ 299</strong> · Produção própria ·
            Enviamos para todo o Brasil
          </p>
        </div>
      </div>

      <header
        className={cx(
          "sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          hidden ? "-translate-y-full" : "translate-y-0",
          scrolled
            ? "border-b border-white/10 bg-ink/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
          <Logo size={scrolled ? 34 : 40} />

          {/* Navegação desktop */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {navLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cx(
                    "relative rounded-full px-4 py-2 text-sm transition-colors duration-300",
                    active
                      ? "text-white"
                      : "text-silver-400 hover:text-white",
                  )}
                >
                  {link.label}
                  <span
                    className={cx(
                      "absolute inset-x-4 -bottom-px h-px origin-left bg-gradient-to-r from-cyan-400 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar produtos"
              className="flex h-10 w-10 items-center justify-center rounded-full text-silver-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>

            <Magnetic strength={0.25}>
              <button
                onClick={openCart}
                aria-label={`Abrir carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-silver-200 transition-all duration-300 hover:bg-white/5 hover:text-white"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8z" />
                  <path d="M9 7a3 3 0 1 1 6 0" />
                </svg>
                {count > 0 && (
                  <span
                    ref={badgeRef}
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-ink shadow-glow"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            </Magnetic>

            <Link
              href="/orcamento"
              className="ml-1.5 hidden rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow md:inline-flex"
            >
              Peça sob medida
            </Link>

            {/* Botão do menu mobile */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5 lg:hidden"
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={cx(
                    "absolute left-0 block h-0.5 w-full rounded bg-current transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)]",
                    menuOpen ? "top-1.5 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cx(
                    "absolute left-0 top-1.5 block h-0.5 rounded bg-current transition-all duration-300",
                    menuOpen ? "w-0 opacity-0" : "w-full opacity-100",
                  )}
                />
                <span
                  className={cx(
                    "absolute left-0 block h-0.5 w-full rounded bg-current transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)]",
                    menuOpen ? "top-1.5 -rotate-45" : "top-3",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      <div
        className={cx(
          "fixed inset-0 z-40 lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={cx(
            "absolute inset-0 bg-ink/80 backdrop-blur-sm transition-opacity duration-400",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          aria-label="Menu"
          className={cx(
            "absolute inset-x-0 top-0 origin-top border-b border-white/10 bg-navy-950 px-6 pb-8 pt-[calc(var(--header-h)+3rem)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            menuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-6 opacity-0",
          )}
        >
          <ul className="flex flex-col">
            {navLinks.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between border-b border-white/5 py-4 font-display text-2xl text-white transition-colors hover:text-cyan-400"
                  style={{ transitionDelay: menuOpen ? `${i * 40}ms` : "0ms" }}
                >
                  {link.label}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/orcamento"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 font-semibold text-ink"
          >
            Peça sob medida
          </Link>
        </nav>
      </div>

      {/* Busca (overlay) */}
      <div
        className={cx(
          "fixed inset-0 z-[60] transition-opacity duration-300",
          searchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="absolute inset-0 bg-ink/85 backdrop-blur-md" onClick={() => setSearchOpen(false)} />
        <div className="container-x relative pt-32">
          <form onSubmit={submitSearch} className="mx-auto max-w-2xl">
            <label htmlFor="site-search" className="sr-only">
              Buscar produtos
            </label>
            <div className="glass border-glow flex items-center gap-3 rounded-2xl px-5 py-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-cyan-400">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={searchInputRef}
                id="site-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar vaso, luminária, suporte, dragão…"
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-muted"
              />
              <kbd className="hidden shrink-0 rounded border border-white/15 px-2 py-1 text-[10px] text-silver-400 sm:block">
                ESC
              </kbd>
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              Dica: use <kbd className="rounded border border-white/15 px-1.5 py-0.5">Ctrl</kbd>{" "}
              + <kbd className="rounded border border-white/15 px-1.5 py-0.5">K</kbd> para abrir a busca
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
