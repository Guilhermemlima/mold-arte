import Link from "next/link";
import Logo from "./Logo";
import Newsletter from "./Newsletter";
import { getCategories } from "@/data/products";
import { site } from "@/lib/site";

const institutional = [
  { href: "/sobre", label: "Sobre a Moldarte" },
  { href: "/orcamento", label: "Orçamento sob medida" },
  { href: "/contato", label: "Contato" },
  { href: "/loja", label: "Todos os produtos" },
];

const help = [
  { href: "/trocas", label: "Trocas e devoluções" },
  { href: "/termos", label: "Termos de compra" },
  { href: "/privacidade", label: "Política de privacidade" },
  { href: "/contato", label: "Prazos e envio" },
];

export default async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-navy-950">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
      <div
        className="absolute -bottom-40 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full bg-steel-600/20 blur-[110px]"
        aria-hidden
      />

      <div className="container-x relative">
        <Newsletter />

        <div className="grid gap-10 border-t border-white/8 py-14 md:grid-cols-2 lg:grid-cols-5">
          {/* Marca */}
          <div className="lg:col-span-2">
            <Logo size={48} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-silver-400">
              {site.description}
            </p>

            <div className="mt-6 flex gap-2.5">
              {[
                { href: site.social.instagram, label: "Instagram", d: "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 0 0 0-13.2zm0 10.9a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm8.4-11.2a1.5 1.5 0 1 1-3.1 0 1.5 1.5 0 0 1 3.1 0z" },
                { href: site.social.tiktok, label: "TikTok", d: "M16.6 5.8a4.8 4.8 0 0 1-1.1-3.1h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.4a5.8 5.8 0 1 0 4.9 5.7V9.3a7.9 7.9 0 0 0 4.5 1.4V7.6a4.8 4.8 0 0 1-3.4-1.8z" },
                { href: site.social.facebook, label: "Facebook", d: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="glass flex h-10 w-10 items-center justify-center rounded-full text-silver-400 transition-all duration-300 hover:text-cyan-400 hover:shadow-glow"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Categorias */}
          <nav aria-label="Categorias">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Categorias
            </h3>
            <ul className="mt-4 space-y-2.5">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={category.href ?? `/loja?categoria=${category.slug}`}
                    className="text-sm text-silver-400 transition-colors hover:text-cyan-400"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Institucional */}
          <nav aria-label="Institucional">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Moldarte
            </h3>
            <ul className="mt-4 space-y-2.5">
              {institutional.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-silver-400 transition-colors hover:text-cyan-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Ajuda */}
          <nav aria-label="Ajuda">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Ajuda
            </h3>
            <ul className="mt-4 space-y-2.5">
              {help.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="text-sm text-silver-400 transition-colors hover:text-cyan-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-1.5 text-sm">
              <a
                href={`mailto:${site.contact.email}`}
                className="block text-silver-400 transition-colors hover:text-cyan-400"
              >
                {site.contact.email}
              </a>
              <p className="text-silver-400">{site.contact.whatsappLabel}</p>
            </div>
          </nav>
        </div>

        {/* Pagamentos + legal */}
        <div className="flex flex-col gap-5 border-t border-white/8 py-7 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] uppercase tracking-wider text-muted">
              Pagamento
            </span>
            {["Pix", "Visa", "Master", "Elo", "Amex", "Boleto"].map((brand) => (
              <span
                key={brand}
                className="rounded border border-white/10 bg-white/4 px-2.5 py-1 text-[10px] font-medium text-silver-400"
              >
                {brand}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-cyan-400">
              <path d="M12 3 5 6v6c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6z" />
              <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Compra segura · dados criptografados
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/8 py-6 text-[11px] text-muted md:flex-row">
          {/* Identificação de quem vende: o decreto 7.962/2013 exige que ela
              apareça em destaque na loja virtual. */}
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} {site.name} — marca de{" "}
            {site.empresa.razaoSocial}
            <br className="hidden md:block" />
            <span className="md:mr-2">CNPJ {site.empresa.cnpj}</span>·
            <span className="ml-2">
              {site.empresa.cidade}/{site.empresa.uf}
            </span>
          </p>
          <p className="text-center md:text-right">
            Peças produzidas sob demanda · Imagens meramente ilustrativas
          </p>
        </div>
      </div>

      {/* Marca d'água gigante */}
      <div
        className="pointer-events-none select-none overflow-hidden pb-2"
        aria-hidden
      >
        <p className="text-center font-display text-[13vw] font-bold leading-[0.8] tracking-tighter text-white/[0.025]">
          MOLDARTE 3D
        </p>
      </div>
    </footer>
  );
}
