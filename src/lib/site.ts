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
   * Frete por região e por peso, saindo de Guarapuava.
   *
   * Antes era um valor por região, e um valor só está errado nas duas pontas:
   * o chaveiro de 40 g pagava frete de vaso, e o vaso de 900 g saía barato
   * demais com a diferença vindo do lucro. Os Correios cobram por peso e por
   * distância; a tabela abaixo tem as duas coisas.
   *
   * Os números vieram da cotação real dos Correios, que traz uma faixa por
   * célula (o estado mais perto e o mais longe dentro da mesma região). Aqui
   * está o meio de cada faixa: cobrar o topo afastaria a venda pequena, que é
   * o grosso da loja, e cobrar o piso faria Manaus sair do bolso.
   *
   * Mudar qualquer número aqui muda a loja inteira — carrinho, checkout,
   * banco e o que o atendimento responde.
   */
  shipping: {
    /**
     * Faixas de peso, em gramas, do mais leve para o mais pesado.
     *
     * `ate` é o teto da faixa. Acima da última, o preço da última continua
     * valendo: é o caso raro (mais de 1 kg de peça), e cobrar a mais por um
     * pacote que talvez nem custe a mais espantaria a venda maior da loja.
     */
    faixasDePeso: [300, 500, 1000],
    regioes: {
      sul:         { fretes: [23.9, 24.9, 28.9], gratisAcima: 299 },
      sudeste:     { fretes: [26.9, 29.9, 33.9], gratisAcima: 299 },
      centroOeste: { fretes: [32.9, 35.9, 40.9], gratisAcima: 399 },
      nordeste:    { fretes: [38.9, 42.9, 48.9], gratisAcima: 449 },
      norte:       { fretes: [46.9, 50.9, 58.9], gratisAcima: 449 },
    },
    /** Enquanto o cliente não informou o CEP, a loja mostra o menor. */
    regiaoPadrao: "sul",
    /**
     * Peso usado quando a peça ainda não tem o dela cadastrado.
     *
     * Peça sem peso cairia na faixa mais barata e o frete sairia do seu bolso
     * calado. Este valor é o meio-termo: erra pouco para os dois lados
     * enquanto você preenche os pesos no Precifica.
     */
    pesoPadraoGramas: 300,
    /**
     * Quanto a embalagem soma ao peso da peça.
     *
     * Caixa, plástico-bolha e fita pesam, e é o pacote fechado que vai para a
     * balança do carteiro. Sem isso, uma peça de 295 g cairia na primeira
     * faixa no site e na segunda no guichê.
     */
    embalagemGramas: 60,
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

  /**
   * Desconto de quem paga por Pix, em porcento.
   *
   * O site anunciava esses 5% em tres lugares sem que eles existissem em
   * lugar nenhum do servidor: o pedido era gravado e cobrado pelo valor
   * cheio. Agora a taxa mora aqui, vai junto no pedido e o banco aplica —
   * mudar este numero muda o que a tela promete e o que a cobranca traz,
   * juntos. Zero desliga o desconto e some com o anuncio.
   */
  descontoPix: 5,

  /**
   * Pedido de empresa: brindes e chaveiros com a marca do cliente.
   *
   * Os dois números são decisão sua, não do código — a página inteira lê
   * daqui, então mudar aqui muda o que ela promete. O mínimo existe para o
   * lote pagar o tempo de preparar arte, ajustar o modelo e imprimir; abaixo
   * dele o trabalho de montar o pedido custa mais do que a venda rende.
   */
  brindes: {
    /** Pedido mínimo, em peças. */
    minimo: 50,
    /** Prazo típico de um lote, em dias úteis, contando da aprovação. */
    prazoDias: 15,
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
  { href: "/brindes", label: "Empresas" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
] as const;
