import { site } from "./site";

/**
 * Frete por região.
 *
 * A conta acontece em dois lugares: aqui, para a tela mostrar o valor certo
 * enquanto a pessoa compra, e de novo no banco, na hora de fechar o pedido.
 * A do banco é a que vale — esta serve para não mentir na tela. Frete vindo
 * do navegador seria editável, e já foi assim uma vez.
 */

export type Regiao = keyof typeof site.shipping.regioes;

/** Sigla do estado → região dos Correios. */
const REGIAO_POR_UF: Record<string, Regiao> = {
  PR: "sul", SC: "sul", RS: "sul",
  SP: "sudeste", RJ: "sudeste", MG: "sudeste", ES: "sudeste",
  GO: "centroOeste", MT: "centroOeste", MS: "centroOeste", DF: "centroOeste",
  BA: "nordeste", SE: "nordeste", AL: "nordeste", PE: "nordeste",
  PB: "nordeste", RN: "nordeste", CE: "nordeste", PI: "nordeste", MA: "nordeste",
  PA: "norte", AP: "norte", AM: "norte", RR: "norte", RO: "norte",
  AC: "norte", TO: "norte",
};

export const NOME_DA_REGIAO: Record<Regiao, string> = {
  sul: "Sul",
  sudeste: "Sudeste",
  centroOeste: "Centro-Oeste",
  nordeste: "Nordeste",
  norte: "Norte",
};

export function regiaoDaUf(uf?: string | null): Regiao {
  const sigla = String(uf ?? "").trim().toUpperCase();
  // Estado desconhecido cai na região padrão em vez de quebrar a compra. Se
  // o valor sair errado, o prejuízo é de um frete; travar o checkout custa a
  // venda inteira.
  return REGIAO_POR_UF[sigla] ?? (site.shipping.regiaoPadrao as Regiao);
}

export type Frete = {
  regiao: Regiao;
  /** O que o cliente paga: já considera o piso do frete grátis. */
  valor: number;
  /** Quanto custaria sem a promoção — usado para explicar o "grátis". */
  tabela: number;
  gratisAcima: number;
  gratis: boolean;
  /** Quanto falta para o frete ficar grátis nesta região. */
  faltaParaGratis: number;
  /** Peso do pacote fechado, em gramas — peças mais embalagem. */
  pesoGramas: number;
  /** Teto da faixa que foi aplicada, para a tela poder explicar. */
  faixaAte: number;
};

/**
 * Qual faixa de peso cobre este pacote.
 *
 * Acima da última faixa devolve a última: mais de 1 kg de peça é caso raro
 * aqui, e inventar um preço maior para um pacote que talvez nem custe mais
 * afastaria justamente o pedido grande.
 */
export function faixaDoPeso(pesoGramas: number) {
  const faixas = site.shipping.faixasDePeso;
  const i = faixas.findIndex((ate) => pesoGramas <= ate);
  return i < 0 ? faixas.length - 1 : i;
}

/** Peso do pacote: o que vai dentro mais a caixa. */
export function pesoDoPacote(pesoDasPecas: number) {
  return pesoDasPecas > 0 ? pesoDasPecas + site.shipping.embalagemGramas : 0;
}

export function calculaFrete(
  subtotal: number,
  uf?: string | null,
  /** Cupom de frete grátis zera independentemente da região. */
  cupomDeFrete = false,
  /**
   * Peso das peças do carrinho, em gramas, sem a embalagem.
   *
   * Zero cai na faixa mais leve — que é o certo para o carrinho vazio e para
   * a vitrine, onde a loja anuncia o menor frete possível.
   */
  pesoDasPecas = 0,
): Frete {
  const regiao = regiaoDaUf(uf);
  const { fretes, gratisAcima } = site.shipping.regioes[regiao];

  const pesoGramas = pesoDoPacote(pesoDasPecas);
  const faixa = faixaDoPeso(pesoGramas);
  const frete = fretes[faixa];

  // Carrinho vazio não mostra frete: um "R$ 23,90" antes de escolher a peça
  // só assusta.
  const gratis = cupomDeFrete || subtotal === 0 || subtotal >= gratisAcima;

  return {
    regiao,
    valor: gratis ? 0 : frete,
    tabela: frete,
    gratisAcima,
    gratis,
    faltaParaGratis: Math.max(0, gratisAcima - subtotal),
    pesoGramas,
    faixaAte: site.shipping.faixasDePeso[faixa],
  };
}

/** A região mais barata — o que a loja anuncia antes de conhecer o CEP. */
export function menorPiso() {
  const faixas = Object.values(site.shipping.regioes);
  return Math.min(...faixas.map((f) => f.gratisAcima));
}

/** As regiões que alcançam o menor piso, para o aviso do topo ser verdade. */
export function regioesDoMenorPiso() {
  const piso = menorPiso();
  return (Object.keys(site.shipping.regioes) as Regiao[])
    .filter((r) => site.shipping.regioes[r].gratisAcima === piso)
    .map((r) => NOME_DA_REGIAO[r]);
}
