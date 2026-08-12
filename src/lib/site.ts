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
    whatsapp: "5542991250274",
    whatsappLabel: "(42) 99125-0274",
    email: "moldarte3d@gmail.com",
    city: "Brasil",
  },

  social: {
    instagram: "https://www.instagram.com/moldarte.3d/",
    instagramArroba: "@moldarte.3d",
    tiktok: "https://www.tiktok.com/@moldarte3d",
    tiktokArroba: "@moldarte3d",
    facebook: "https://www.facebook.com/profile.php?id=61571150574753",
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
function daVercel() {
  // O endereço estável do projeto (mold-arte.vercel.app). Precisa vir antes de
  // VERCEL_URL, que é o endereço único daquele deploy — algo como
  // "mold-arte-8g0uxakvj-....vercel.app", que muda a cada publicação. Usar
  // aquele no sitemap manda o Google indexar uma versão congelada do site.
  const producao = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (producao) return `https://${producao}`;

  const deploy = process.env.NEXT_PUBLIC_VERCEL_URL;
  return deploy ? `https://${deploy}` : null;
}

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? daVercel() ?? site.url;

export function whatsappLink(message: string) {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const navLinks = [
  { href: "/loja", label: "Loja" },
  { href: "/orcamento", label: "Sob medida" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
] as const;
