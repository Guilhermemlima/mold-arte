/**
 * Configuração central da marca.
 * Mude aqui e o site inteiro acompanha (header, footer, SEO, WhatsApp, e-mails).
 */
export const site = {
  name: "Moldarte 3D",
  legalName: "Moldarte 3D",
  tagline: "Da ideia à peça pronta",
  description:
    "Peças de impressão 3D sob medida: protótipos, itens de decoração, peças técnicas e projetos personalizados com acabamento profissional.",
  url: "https://moldarte3d.com.br",
  locale: "pt-BR",
  currency: "BRL",

  contact: {
    // Formato internacional, só dígitos — usado no link do WhatsApp.
    whatsapp: "5500000000000",
    whatsappLabel: "(00) 00000-0000",
    email: "contato@moldarte3d.com.br",
    city: "Brasil",
  },

  social: {
    instagram: "https://instagram.com/moldarte3d",
    tiktok: "https://tiktok.com/@moldarte3d",
    youtube: "https://youtube.com/@moldarte3d",
  },

  shipping: {
    freeShippingFrom: 299,
    flatRate: 24.9,
  },
} as const;

/**
 * Endereço público do site, resolvido na seguinte ordem:
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — defina quando o domínio próprio estiver no ar
 * 2. o domínio que a Vercel gera sozinha (ex.: mold-arte.vercel.app)
 * 3. `site.url` como último recurso
 *
 * É esse endereço que monta o sitemap e as URLs absolutas da miniatura de
 * compartilhamento — apontar para um domínio que ainda não existe faria o
 * link aparecer sem imagem no WhatsApp e nas redes.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : site.url);

export function whatsappLink(message: string) {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const navLinks = [
  { href: "/loja", label: "Loja" },
  { href: "/orcamento", label: "Sob medida" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
] as const;
