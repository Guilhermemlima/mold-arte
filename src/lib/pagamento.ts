import { site } from "./site";

/**
 * Desconto do Pix.
 *
 * A regra mora aqui porque ela é feita duas vezes: nesta tela, para o cliente
 * ver o valor certo enquanto compra, e de novo no banco (`supabase-pix.sql`),
 * na hora de fechar o pedido. A do banco é a que vale — a daqui existe para a
 * tela não prometer um número e a cobrança chegar com outro.
 *
 * Se as duas contas discordarem, a diferença aparece no pior lugar possível:
 * na hora de pagar. Por isso as duas seguem a mesma frase — desconto sobre a
 * mercadoria já com o cupom aplicado, nunca sobre o frete.
 */

/** Quanto o Pix abate, em reais. */
export function descontoDoPix(subtotal: number, descontoDoCupom = 0) {
  const base = Math.max(0, subtotal - descontoDoCupom);
  // Arredonda em centavos com Math.round, e não com toFixed: o banco usa
  // round() de numeric, que sobe no meio exato. O toFixed decide pelo valor
  // binário e às vezes desce — bastaria um centavo de diferença para a tela
  // e a cobrança discordarem, que é justamente o que se quer evitar aqui.
  return Math.round(base * site.descontoPix) / 100;
}

/** O texto que aparece ao lado do valor, para não repetir "5%" espalhado. */
export const rotuloDoPix = `${site.descontoPix}% off no Pix`;
