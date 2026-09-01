/**
 * Camada de dados do catálogo.
 *
 * A fonte de verdade é o **Precifica 3D**: cada peça marcada como "Publicar
 * na loja" vira uma linha no Supabase, e é isso que as funções do fim deste
 * arquivo leem. Você precifica lá, marca publicar, e a peça aparece aqui —
 * sem tocar em código nem refazer o deploy.
 *
 * Enquanto o Supabase não estiver configurado (as variáveis de ambiente em
 * `.env.example`), o site cai no catálogo de demonstração abaixo, para não
 * ficar uma vitrine vazia durante o desenvolvimento.
 */

import { buscaVitrine, type LinhaVitrine } from "@/lib/supabase";

export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: "deco" | "tech" | "collect" | "gift" | "light" | "custom";
  /** Destino alternativo — para categorias que não são uma prateleira da loja. */
  href?: string;
};

export type ProductOption = {
  /** ex.: "Cor", "Tamanho", "Material" */
  name: string;
  values: { label: string; hex?: string; priceDelta?: number }[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  /** Preço "de" — usado para mostrar desconto. */
  compareAtPrice?: number;
  category: string;
  /** Nome da categoria como escrito no Precifica ("Colecionáveis"). */
  categoryName?: string;
  tags: string[];
  /** Só existe no catálogo de demonstração: o Precifica não coleta avaliação. */
  rating?: number;
  reviews?: number;
  stock: number;
  /** Peça sem preço fechado: o botão vira "pedir orçamento". */
  sobConsulta?: boolean;
  /**
   * Desconto por quantidade, vindo das faixas da calculadora.
   * A primeira linha é sempre 1 unidade pelo preço cheio.
   */
  faixas?: { qtd: number; preco: number }[];
  /** Dias úteis de produção antes do envio. */
  leadTimeDays: number;
  /**
   * Peso da peça em gramas, sem embalagem. É o que decide a faixa de frete.
   *
   * Indefinido em peça publicada antes de o peso existir; quem lê aplica o
   * padrão de `site.ts` em vez de tratar como zero — peça sem peso cairia na
   * faixa mais barata e a diferença sairia do lucro.
   */
  pesoGramas?: number;
  /** Peso por tamanho, quando os tamanhos pesam diferente. */
  pesoPorTamanho?: Record<string, number>;
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
  specs: { label: string; value: string }[];
  options: ProductOption[];
  /** URLs reais das fotos. Vazio = placeholder procedural da marca. */
  images: string[];
};

export const categories: Category[] = [
  {
    slug: "decoracao",
    name: "Decoração",
    description: "Vasos, esculturas e objetos que mudam o ambiente.",
    icon: "deco",
  },
  {
    slug: "luminarias",
    name: "Luminárias",
    description: "Abajures e luminárias com difusão de luz desenhada.",
    icon: "light",
  },
  {
    slug: "colecionaveis",
    name: "Colecionáveis",
    description: "Miniaturas, action figures e peças de coleção.",
    icon: "collect",
  },
  {
    slug: "funcionais",
    name: "Peças técnicas",
    description: "Suportes, engrenagens, gabaritos e reposição.",
    icon: "tech",
  },
  {
    slug: "presentes",
    name: "Presentes",
    description: "Personalizados com nome, data ou logo.",
    icon: "gift",
  },
  {
    slug: "sob-medida",
    name: "Sob medida",
    description: "Seu arquivo, seu projeto, sua peça.",
    icon: "custom",
    // Não é prateleira: leva direto para o formulário de orçamento.
    href: "/orcamento",
  },
];

const colors = {
  name: "Cor",
  values: [
    { label: "Preto fosco", hex: "#14181d" },
    { label: "Branco gelo", hex: "#e8edf2" },
    { label: "Azul Moldarte", hex: "#1e4370" },
    { label: "Ciano elétrico", hex: "#38d8f5" },
    { label: "Prata metálico", hex: "#aab6c4" },
  ],
};

const sizes = (deltas: number[]) => ({
  name: "Tamanho",
  values: [
    { label: "P", priceDelta: deltas[0] },
    { label: "M", priceDelta: deltas[1] },
    { label: "G", priceDelta: deltas[2] },
  ],
});

const materials = {
  name: "Material",
  values: [
    { label: "PLA", priceDelta: 0 },
    { label: "PETG", priceDelta: 18 },
  ],
};

export const products: Product[] = [
  {
    id: "p-001",
    slug: "vaso-onda-espiral",
    name: "Vaso Onda Espiral",
    shortDescription: "Vaso em espiral contínua com parede de 1,2 mm.",
    description:
      "Impresso em vase mode, o Onda Espiral tem parede contínua sem emendas visíveis e uma torção que muda completamente conforme a luz do ambiente bate nele. Vai com copo interno em PETG, então pode receber água sem risco de vazamento.",
    price: 129.9,
    compareAtPrice: 169.9,
    category: "decoracao",
    tags: ["vaso", "sala", "presente"],
    rating: 4.9,
    reviews: 187,
    stock: 24,
    leadTimeDays: 3,
    featured: true,
    bestSeller: true,
    specs: [
      { label: "Altura", value: "24 cm" },
      { label: "Diâmetro", value: "12 cm" },
      { label: "Camada", value: "0,2 mm" },
      { label: "Preenchimento", value: "Vase mode" },
    ],
    options: [colors, sizes([0, 40, 85])],
    images: [],
  },
  {
    id: "p-002",
    slug: "luminaria-lobo-moldarte",
    name: "Luminária Lobo Moldarte",
    shortDescription: "Litofania do lobo da marca com LED regulável.",
    description:
      "A peça-símbolo da casa. Litofania de 2,8 mm que, apagada, parece um painel branco — acesa, revela o lobo em profundidade completa. Base em preto fosco com LED de temperatura ajustável e cabo USB-C.",
    price: 279.9,
    category: "luminarias",
    tags: ["lobo", "led", "litofania", "marca"],
    rating: 5,
    reviews: 96,
    stock: 12,
    leadTimeDays: 5,
    featured: true,
    isNew: true,
    specs: [
      { label: "Altura", value: "22 cm" },
      { label: "Alimentação", value: "USB-C 5V" },
      { label: "Luz", value: "2700K–6000K" },
      { label: "Camada", value: "0,12 mm" },
    ],
    options: [
      {
        name: "Base",
        values: [
          { label: "Preto fosco", hex: "#14181d" },
          { label: "Nogueira", hex: "#6b4a2f", priceDelta: 35 },
        ],
      },
    ],
    images: [],
  },
  {
    id: "p-003",
    slug: "suporte-headset-gamer",
    name: "Suporte de Headset Gamer",
    shortDescription: "Suporte de mesa com passagem de cabo e base pesada.",
    description:
      "Projetado para não tombar: base larga com compartimento para lastro, haste com curva anatômica que não marca a espuma do headset e canaleta traseira para organizar o cabo. Pés em TPU antiderrapante.",
    price: 89.9,
    category: "funcionais",
    tags: ["setup", "gamer", "mesa"],
    rating: 4.8,
    reviews: 341,
    stock: 58,
    leadTimeDays: 2,
    featured: true,
    bestSeller: true,
    specs: [
      { label: "Altura", value: "28 cm" },
      { label: "Base", value: "13 × 13 cm" },
      { label: "Preenchimento", value: "25% giroide" },
      { label: "Pés", value: "TPU 95A" },
    ],
    options: [colors, materials],
    images: [],
  },
  {
    id: "p-004",
    slug: "dragao-articulado",
    name: "Dragão Articulado",
    shortDescription: "78 elos móveis, impresso já montado.",
    description:
      "Sai da impressora inteiro e já articulado — nenhuma peça para encaixar. São 78 elos que se movem individualmente, o que dá aquele efeito de peso e fluidez na mão. Vira fidget, decoração de estante ou presente que ninguém espera.",
    price: 159.9,
    compareAtPrice: 199.9,
    category: "colecionaveis",
    tags: ["dragão", "fidget", "articulado"],
    rating: 4.9,
    reviews: 512,
    stock: 33,
    leadTimeDays: 4,
    featured: true,
    bestSeller: true,
    specs: [
      { label: "Comprimento", value: "42 cm" },
      { label: "Elos", value: "78 articulações" },
      { label: "Camada", value: "0,16 mm" },
      { label: "Montagem", value: "Nenhuma" },
    ],
    options: [
      {
        name: "Acabamento",
        values: [
          { label: "Fosco", hex: "#1e4370" },
          { label: "Seda", hex: "#4a8fd0", priceDelta: 25 },
          { label: "Gradiente", hex: "#38d8f5", priceDelta: 55 },
        ],
      },
      sizes([0, 60, 130]),
    ],
    images: [],
  },
  {
    id: "p-005",
    slug: "placa-nome-personalizada",
    name: "Placa de Nome Personalizada",
    shortDescription: "Seu nome em relevo, com ou sem retroiluminação.",
    description:
      "Você manda o nome, a gente modela. Letras em relevo de 4 mm sobre placa com acabamento escovado. Na versão iluminada, as letras ficam vazadas com difusor leitoso e fita LED embutida.",
    price: 74.9,
    category: "presentes",
    tags: ["personalizado", "nome", "presente"],
    rating: 4.7,
    reviews: 228,
    stock: 99,
    leadTimeDays: 3,
    isNew: true,
    specs: [
      { label: "Largura", value: "18–32 cm" },
      { label: "Relevo", value: "4 mm" },
      { label: "Fixação", value: "Base ou parede" },
      { label: "Fonte", value: "6 opções" },
    ],
    options: [
      colors,
      {
        name: "Iluminação",
        values: [
          { label: "Sem LED", priceDelta: 0 },
          { label: "Com LED", priceDelta: 69 },
        ],
      },
    ],
    images: [],
  },
  {
    id: "p-006",
    slug: "organizador-modular-bancada",
    name: "Organizador Modular de Bancada",
    shortDescription: "Sistema de encaixe que cresce junto com a bagunça.",
    description:
      "Módulos que se encaixam lateralmente por rabo de andorinha. Comece com três e vá somando conforme precisar — gavetas, porta-ferramentas, porta-canetas e bandejas usam o mesmo padrão de encaixe.",
    price: 119.9,
    category: "funcionais",
    tags: ["organização", "oficina", "escritório"],
    rating: 4.8,
    reviews: 164,
    stock: 41,
    leadTimeDays: 3,
    specs: [
      { label: "Módulo", value: "10 × 10 cm" },
      { label: "Kit inicial", value: "3 peças" },
      { label: "Encaixe", value: "Rabo de andorinha" },
      { label: "Material", value: "PETG" },
    ],
    options: [
      colors,
      {
        name: "Kit",
        values: [
          { label: "3 módulos", priceDelta: 0 },
          { label: "6 módulos", priceDelta: 95 },
          { label: "12 módulos", priceDelta: 210 },
        ],
      },
    ],
    images: [],
  },
  {
    id: "p-007",
    slug: "escultura-geometrica-lobo",
    name: "Escultura Geométrica Lobo",
    shortDescription: "Low poly de 30 cm, o mascote em versão escultura.",
    description:
      "O lobo da Moldarte em low poly, com facetas grandes que pegam luz de formas diferentes ao longo do dia. Impresso em alta resolução, lixado e pintado à mão peça por peça.",
    price: 349.9,
    category: "decoracao",
    tags: ["lobo", "escultura", "low poly", "marca"],
    rating: 5,
    reviews: 74,
    stock: 8,
    leadTimeDays: 7,
    featured: true,
    specs: [
      { label: "Altura", value: "30 cm" },
      { label: "Acabamento", value: "Lixado e pintado" },
      { label: "Camada", value: "0,1 mm" },
      { label: "Peso", value: "820 g" },
    ],
    options: [
      {
        name: "Pintura",
        values: [
          { label: "Azul-aço", hex: "#1e4370" },
          { label: "Grafite", hex: "#2b2f36" },
          { label: "Cromado", hex: "#c3d2e2", priceDelta: 90 },
        ],
      },
    ],
    images: [],
  },
  {
    id: "p-008",
    slug: "abajur-nervuras",
    name: "Abajur Nervuras",
    shortDescription: "Sombras em leque projetadas na parede.",
    description:
      "As nervuras verticais não são só estética: elas fatiam a luz e jogam um leque de sombras na parede atrás. Funciona muito bem em canto de sala e cabeceira. Soquete E27, lâmpada não inclusa.",
    price: 219.9,
    category: "luminarias",
    tags: ["abajur", "luz", "sala"],
    rating: 4.9,
    reviews: 118,
    stock: 17,
    leadTimeDays: 5,
    specs: [
      { label: "Altura", value: "34 cm" },
      { label: "Soquete", value: "E27" },
      { label: "Parede", value: "1,6 mm" },
      { label: "Lâmpada", value: "Não inclusa" },
    ],
    options: [colors],
    images: [],
  },
  {
    id: "p-009",
    slug: "miniatura-rpg-kit",
    name: "Kit Miniaturas de RPG",
    shortDescription: "6 miniaturas em PLA, escala 32 mm.",
    description:
      "Seis miniaturas na escala 32 mm impressas em camada fina, com detalhe suficiente para receber pintura. Vêm em cinza primer, prontas para tinta.",
    price: 189.9,
    compareAtPrice: 239.9,
    category: "colecionaveis",
    tags: ["rpg", "miniatura", "boardgame"],
    rating: 4.8,
    reviews: 203,
    stock: 26,
    leadTimeDays: 6,
    isNew: true,
    specs: [
      { label: "Escala", value: "32 mm" },
      { label: "Peças", value: "6 miniaturas" },
      { label: "Camada", value: "0,08 mm" },
      { label: "Material", value: "PLA" },
    ],
    options: [
      {
        name: "Tema",
        values: [
          { label: "Heróis" },
          { label: "Monstros" },
          { label: "Sortido" },
        ],
      },
    ],
    images: [],
  },
  {
    id: "p-010",
    slug: "engrenagem-reposicao",
    name: "Engrenagem de Reposição",
    shortDescription: "Peça técnica sob medida a partir da sua amostra.",
    description:
      "Quebrou uma engrenagem de eletrodoméstico e não se acha reposição? Mande a peça quebrada ou as medidas: modelamos e imprimimos em PETG, com tolerância dimensional de ±0,15 mm.",
    price: 99.9,
    category: "funcionais",
    tags: ["reposição", "técnica", "conserto"],
    rating: 4.7,
    reviews: 88,
    stock: 999,
    leadTimeDays: 6,
    specs: [
      { label: "Tolerância", value: "±0,15 mm" },
      { label: "Material", value: "PETG" },
      { label: "Modelagem", value: "Inclusa" },
      { label: "Prazo", value: "6 dias úteis" },
    ],
    options: [colors],
    images: [],
  },
  {
    id: "p-011",
    slug: "porta-copos-hexagonal",
    name: "Porta-Copos Hexagonal",
    shortDescription: "Jogo com 6 peças e suporte de encaixe.",
    description:
      "Hexágonos que se encaixam entre si e ainda formam uma torre no suporte central. Superfície texturizada que segura o copo e disfarça marca d'água.",
    price: 59.9,
    category: "decoracao",
    tags: ["mesa", "cozinha", "kit"],
    rating: 4.6,
    reviews: 276,
    stock: 87,
    leadTimeDays: 2,
    specs: [
      { label: "Peças", value: "6 + suporte" },
      { label: "Diâmetro", value: "10 cm" },
      { label: "Espessura", value: "6 mm" },
      { label: "Textura", value: "Fuzzy skin" },
    ],
    options: [colors],
    images: [],
  },
  {
    id: "p-012",
    slug: "chaveiro-personalizado",
    name: "Chaveiro Personalizado",
    shortDescription: "Nome, logo ou placa — a partir de 10 unidades.",
    description:
      "Chaveiro em duas cores com seu nome, logo da empresa ou placa do carro. Preço por unidade cai bastante a partir de 50 peças — bom para brinde corporativo e evento.",
    price: 24.9,
    category: "presentes",
    tags: ["personalizado", "brinde", "corporativo"],
    rating: 4.8,
    reviews: 431,
    stock: 999,
    leadTimeDays: 3,
    bestSeller: true,
    specs: [
      { label: "Tamanho", value: "6 × 3 cm" },
      { label: "Cores", value: "Bicolor" },
      { label: "Mínimo", value: "10 unidades" },
      { label: "Argola", value: "Inclusa" },
    ],
    // Exemplo do desconto por quantidade que vem das faixas da calculadora.
    faixas: [
      { qtd: 1, preco: 24.9 },
      { qtd: 3, preco: 22.9 },
      { qtd: 5, preco: 19.9 },
      { qtd: 10, preco: 17.9 },
    ],
    options: [
      colors,
      {
        name: "Quantidade",
        values: [
          { label: "10 un", priceDelta: 0 },
          { label: "50 un", priceDelta: 89 },
          { label: "100 un", priceDelta: 159 },
        ],
      },
    ],
    images: [],
  },
  {
    id: "p-013",
    slug: "suporte-celular-ajustavel",
    name: "Suporte de Celular Ajustável",
    shortDescription: "Dobra em três posições e some na gaveta.",
    description:
      "Dobradiças impressas junto com a peça — nenhum parafuso. Abre em três ângulos para vídeo, leitura e videochamada, e fecha em um bloco de 1,5 cm de espessura.",
    price: 44.9,
    category: "funcionais",
    tags: ["celular", "mesa", "viagem"],
    rating: 4.7,
    reviews: 389,
    stock: 120,
    leadTimeDays: 2,
    specs: [
      { label: "Fechado", value: "9 × 6 × 1,5 cm" },
      { label: "Ângulos", value: "3 posições" },
      { label: "Suporta", value: "Até 320 g" },
      { label: "Antiderrapante", value: "TPU" },
    ],
    options: [colors],
    images: [],
  },
  {
    id: "p-014",
    slug: "trofeu-personalizado",
    name: "Troféu Personalizado",
    shortDescription: "Premiação com gravação em relevo e base sólida.",
    description:
      "Para campeonato, evento de empresa ou aquele prêmio interno de brincadeira. Corpo em duas partes com base preenchida para dar peso de troféu de verdade, e gravação em relevo do nome e da data.",
    price: 189.9,
    category: "presentes",
    tags: ["troféu", "evento", "corporativo", "personalizado"],
    rating: 4.9,
    reviews: 67,
    stock: 45,
    leadTimeDays: 7,
    specs: [
      { label: "Altura", value: "26 cm" },
      { label: "Peso", value: "640 g" },
      { label: "Gravação", value: "Relevo 2 mm" },
      { label: "Base", value: "Preenchida" },
    ],
    options: [
      {
        name: "Acabamento",
        values: [
          { label: "Dourado", hex: "#c9a227" },
          { label: "Prata", hex: "#c3d2e2" },
          { label: "Azul Moldarte", hex: "#1e4370" },
        ],
      },
    ],
    images: [],
  },
];

/* ==========================================================================
   Tradução: produto do Precifica → produto da loja
   ========================================================================== */

/** Primeira frase da descrição, para o texto curto do cartão. */
function resumo(texto: string, nome: string) {
  const limpo = (texto || "").trim();
  if (!limpo) return `${nome} em impressão 3D, produzida sob demanda.`;
  const frase = limpo.split(/(?<=[.!?])\s/)[0];
  return frase.length > 140 ? `${frase.slice(0, 137)}…` : frase;
}

function traduz(linha: LinhaVitrine): Product {
  const consulta = linha.modo === "consulta";

  // Os tamanhos do Precifica viram a variação "Tamanho": o menor preço é a
  // base do produto e os demais entram como adicional.
  const options = linha.tamanhos.length > 1
    ? [
        {
          name: "Tamanho",
          values: linha.tamanhos.map((t) => ({
            label: t.nome,
            priceDelta: t.adicional,
          })),
        },
      ]
    : [];

  const specs = [
    linha.tamanhos.length
      ? {
          label: "Tamanhos",
          value: linha.tamanhos.map((t) => t.nome).join(" · "),
        }
      : null,
    linha.universo ? { label: "Universo", value: linha.universo } : null,
    linha.estilo ? { label: "Estilo", value: linha.estilo } : null,
    linha.caracteristicas
      ? { label: "Características", value: linha.caracteristicas }
      : null,
    { label: "Produção", value: `${linha.prazoDias} dias úteis` },
  ].filter((s): s is { label: string; value: string } => s !== null);

  return {
    id: linha.slug,
    slug: linha.slug,
    name: linha.nome,
    shortDescription: resumo(linha.descricao, linha.nome),
    description: linha.descricao || resumo("", linha.nome),
    price: linha.preco,
    category: linha.categoriaSlug,
    categoryName: linha.categoria,
    tags: [linha.universo, linha.estilo, linha.categoria]
      .map((t) => (t || "").trim())
      .filter(Boolean),
    stock: consulta ? 999 : linha.estoque,
    sobConsulta: consulta,
    // Guardamos só quando há degrau de verdade: uma faixa única (1 un) não é
    // desconto nenhum e só ocuparia espaço na página.
    faixas: (linha.faixas ?? []).length > 1 ? linha.faixas : undefined,
    leadTimeDays: linha.prazoDias,
    pesoGramas: linha.pesoGramas,
    pesoPorTamanho: Object.fromEntries(
      (linha.tamanhos ?? [])
        .filter((t) => (t.pesoGramas ?? 0) > 0)
        .map((t) => [t.nome, t.pesoGramas as number]),
    ),
    specs,
    options,
    // A galeria quando existir; senão a foto única, que é o que os produtos
    // publicados antes desta mudança têm.
    images: linha.fotos?.length ? linha.fotos : linha.foto ? [linha.foto] : [],
  };
}

/* ==========================================================================
   API do catálogo — usada por todas as páginas
   ========================================================================== */

/** Lê a vitrine publicada; cai no catálogo de demonstração se não houver banco. */
async function catalogo(): Promise<Product[]> {
  const linhas = await buscaVitrine();
  // `null` = Supabase não configurado. Lista vazia = configurado, porém nada
  // publicado ainda — e aí a vitrine mostra "nenhum produto", não peça falsa.
  if (linhas === null) return products;
  return linhas.map(traduz);
}

export async function getAllProducts(): Promise<Product[]> {
  return catalogo();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const todos = await catalogo();
  return todos.find((p) => p.slug === slug) ?? null;
}

/**
 * O que aparece no destaque da home. No catálogo de demonstração são as peças
 * marcadas como destaque; vindo do Precifica, são as publicadas mais
 * recentemente (a consulta já devolve em ordem de atualização).
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  const todos = await catalogo();
  const destacados = todos.filter((p) => p.featured);
  return destacados.length ? destacados : todos.slice(0, 5);
}

/** As categorias da loja são as do Precifica: uma fonte de verdade só. */
export async function getCategories(): Promise<Category[]> {
  const todos = await catalogo();

  if (todos === products) return categories;

  const vistas = new Map<string, Category>();
  todos.forEach((produto) => {
    if (!produto.category || vistas.has(produto.category)) return;
    vistas.set(produto.category, {
      slug: produto.category,
      name: produto.categoryName || produto.category,
      description: "",
      icon: iconePara(produto.category),
    });
  });

  const doPrecifica = [...vistas.values()].map((categoria) => ({
    ...categoria,
    description: `${todos.filter((p) => p.category === categoria.slug).length} peça(s) nesta categoria.`,
  }));

  // "Sob medida" não é prateleira: continua levando ao formulário.
  return [...doPrecifica, categories[categories.length - 1]];
}

/** Ícone estável por categoria — o mesmo nome sempre recebe o mesmo desenho. */
function iconePara(slug: string): Category["icon"] {
  const opcoes: Category["icon"][] = ["deco", "light", "collect", "tech", "gift"];
  let soma = 0;
  for (let i = 0; i < slug.length; i++) soma += slug.charCodeAt(i);
  return opcoes[soma % opcoes.length];
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const todos = await catalogo();
  const mesmaCategoria = todos.filter(
    (p) => p.category === product.category && p.id !== product.id,
  );
  const resto = todos.filter(
    (p) => p.category !== product.category && p.id !== product.id,
  );
  return [...mesmaCategoria, ...resto].slice(0, limit);
}

export async function getCategory(slug: string) {
  const todas = await getCategories();
  return todas.find((c) => c.slug === slug);
}

/** Preço final considerando os adicionais das opções escolhidas. */
export function resolvePrice(
  product: Product,
  selected: Record<string, string>,
) {
  return product.options.reduce((total, option) => {
    const value = option.values.find((v) => v.label === selected[option.name]);
    return total + (value?.priceDelta ?? 0);
  }, product.price);
}

/** Teto do filtro de preço, arredondado para cima na dezena de 50 mais próxima. */
export function faixaDePreco(lista: Product[]) {
  const precos = lista.map((p) => p.price).filter((v) => v > 0);
  const maior = precos.length ? Math.max(...precos) : 500;
  return { min: 0, max: Math.max(100, Math.ceil(maior / 50) * 50) };
}
