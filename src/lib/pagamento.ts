import { site } from "./site";

/**
 * As contas de desconto, do jeito que o banco faz.
 *
 * Elas acontecem duas vezes: aqui, para a tela mostrar o valor certo enquanto
 * a pessoa compra, e de novo no banco, na hora de fechar o pedido. A do banco
 * é a que vale — a daqui existe para a tela não prometer um número e a
 * cobrança chegar com outro.
 *
 * Se as duas discordarem, a diferença aparece no pior lugar possível: na hora
 * de pagar. Por isso as duas seguem a mesma frase — desconto sobre a
 * mercadoria, nunca sobre o frete — e o mesmo arredondamento.
 */

/**
 * Arredonda como o Postgres arredonda.
 *
 * Parece detalhe e não é. O banco guarda dinheiro em `numeric`, que é decimal
 * exato: 5% de R$ 0,30 dá 0,015 e vira 0,02, porque metade sobe. O JavaScript
 * guarda em binário, onde 0,015 na verdade é 0,0149999…, e tanto `toFixed`
 * quanto `Math.round` descem para 0,01.
 *
 * Um centavo não quebra ninguém, mas quebra a confiança: é a tela dizendo um
 * total e a cobrança trazendo outro, que é exatamente o defeito que esta loja
 * já teve duas vezes. Aqui a conta é feita em inteiros — centavos e milésimos
 * de porcento —, onde não existe binário para atrapalhar.
 */
function percentualDe(valor: number, percentual: number) {
  const centavos = Math.round(Math.max(0, valor) * 100);
  const milesimos = Math.round(Math.max(0, percentual) * 1000);
  // + 50000 é o "metade sobe" antes de cortar a divisão por 100.000.
  return Math.floor((centavos * milesimos + 50_000) / 100_000) / 100;
}

/** Quanto um cupom de porcentagem abate, em reais. */
export function descontoPercentual(subtotal: number, percentual: number) {
  return percentualDe(subtotal, Math.min(100, percentual));
}

/** Quanto o Pix abate, em reais — sobre a mercadoria já com o cupom. */
export function descontoDoPix(subtotal: number, descontoDoCupom = 0) {
  return percentualDe(Math.max(0, subtotal - descontoDoCupom), site.descontoPix);
}

/** O texto que aparece ao lado do valor, para não repetir "5%" espalhado. */
export const rotuloDoPix = `${site.descontoPix}% off no Pix`;
