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
  url: "https://3dmoldarte.com.br",
  locale: "pt-BR",
  currency: "BRL",

  /**
   * Quem responde pela loja. O decreto 7.962/2013 exige que estes dados
   * apareçam em local de destaque no site.
   *
   * O endereço completo fica de fora por opção do titular: o registrado na
   * Receita é residencial. Consta cidade e estado, além do CNPJ, que permite
   * identificar e localizar a empresa.
   */
  empresa: {
    razaoSocial: "ETERNAQR LTDA",
    cnpj: "43.039.546/0001-69",
    cidade: "Guarapuava",
    uf: "PR",
  },

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

  /**
   * Frete por região, para uma caixa de até 1 kg saindo de Guarapuava.
   *
   * Era um valor único para o Brasil inteiro, e um valor só está errado nas
   * duas pontas: sobrava em Curitiba e faltava em Manaus, com a diferença
   * saindo do lucro. Para os Correios a distância é o que mais pesa, então
   * cinco faixas capturam quase toda a variação sem depender de API nenhuma
   * — e sem criar um jeito novo de o checkout quebrar.
   *
   * ⚠️ Estes valores são um ponto de partida, não uma cotação. Confira no
   * site dos Correios com a sua caixa real e ajuste aqui: é o único lugar.
   */
  shipping: {
    regioes: {
      sul: { frete: 24.9, gratisAcima: 299 },
      sudeste: { frete: 29.9, gratisAcima: 299 },
      centroOeste: { frete: 36.9, gratisAcima: 399 },
      nordeste: { frete: 46.9, gratisAcima: 449 },
      norte: { frete: 56.9, gratisAcima: 449 },
    },
    /** Enquanto o cliente não informou o CEP, a loja mostra o menor. */
    regiaoPadrao: "sul",
  },

  /**
   * Agradecimento por avaliação com foto.
   *
   * Premia a foto, nunca a nota. Se a recompensa dependesse da estrela, todo
   * mundo daria cinco para receber, e a nota do site viraria enfeite — o
   * contrário do que faz uma avaliação valer alguma coisa.
   */
  premioPorFoto: {
    percentual: 10,
    /** Dias de validade do cupom. */
    validadeDias: 60,
    /** Compra mínima para ele valer. 0 = sem mínimo. */
    minimo: 0,
  },

  /**
   * Menor valor que o Asaas aceita cobrar. Mora aqui, e não junto do código
   * do Asaas, porque a tela de checkout precisa dele — e aquele arquivo lê a
   * chave secreta, então não pode ser puxado para o navegador.
   */
  valorMinimoCobranca: 5,
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
