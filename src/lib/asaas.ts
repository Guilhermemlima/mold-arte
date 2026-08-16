import { site } from "./site";

/**
 * Cobrança pelo Asaas.
 *
 * Só roda no servidor. A chave dá acesso à conta financeira inteira — ela
 * nunca pode ganhar o prefixo NEXT_PUBLIC_ nem aparecer em componente de
 * tela.
 *
 * O cliente paga numa página do próprio Asaas. Isso é decisão de segurança,
 * não preguiça: dado de cartão jamais passa por este site, e a obrigação de
 * proteger esse dado fica com quem tem certificação para isso.
 */

const chave = process.env.ASAAS_API_KEY;

// O sandbox é um ambiente de mentira, com dinheiro de mentira. Serve para
// testar o fluxo inteiro sem cobrar ninguém de verdade.
const base =
  process.env.ASAAS_AMBIENTE === "producao"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

export const asaasConfigurado = Boolean(chave);

type Resposta<T> = { ok: true; dados: T } | { ok: false; erro: string };

async function chamar<T>(
  caminho: string,
  opcoes: RequestInit = {},
): Promise<Resposta<T>> {
  if (!chave) return { ok: false, erro: "ASAAS_API_KEY não configurada" };

  try {
    const r = await fetch(`${base}${caminho}`, {
      ...opcoes,
      headers: {
        access_token: chave,
        "Content-Type": "application/json",
        ...(opcoes.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    const texto = await r.text();
    if (!r.ok) {
      console.error(`[asaas] ${caminho} respondeu ${r.status}: ${texto}`);
      // O Asaas devolve os problemas numa lista de erros com descrição.
      let descricao = `erro ${r.status}`;
      try {
        const j = JSON.parse(texto);
        descricao = j?.errors?.[0]?.description ?? descricao;
      } catch {
        /* mantém a descrição genérica */
      }
      return { ok: false, erro: descricao };
    }

    return { ok: true, dados: JSON.parse(texto) as T };
  } catch (e) {
    console.error(`[asaas] ${caminho} falhou:`, e);
    return { ok: false, erro: "não consegui falar com o Asaas" };
  }
}

/* ==========================================================================
   Cliente
   ========================================================================== */

type ClienteAsaas = { id: string };

/**
 * Acha o cliente pelo CPF/CNPJ ou cria um novo.
 *
 * Reaproveitar evita encher a sua conta do Asaas de cadastros repetidos a
 * cada compra da mesma pessoa — e faz o histórico dela ficar junto por lá.
 */
export async function clienteAsaas(dados: {
  nome: string;
  email?: string;
  telefone?: string;
  documento: string;
}): Promise<Resposta<string>> {
  const doc = dados.documento.replace(/\D/g, "");

  const busca = await chamar<{ data: ClienteAsaas[] }>(
    `/customers?cpfCnpj=${doc}&limit=1`,
  );
  if (busca.ok && busca.dados.data?.length) {
    return { ok: true, dados: busca.dados.data[0].id };
  }

  const criado = await chamar<ClienteAsaas>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: dados.nome,
      email: dados.email || undefined,
      mobilePhone: dados.telefone?.replace(/\D/g, "") || undefined,
      cpfCnpj: doc,
      notificationDisabled: false,
    }),
  });

  return criado.ok
    ? { ok: true, dados: criado.dados.id }
    : { ok: false, erro: criado.erro };
}

/* ==========================================================================
   Cobrança
   ========================================================================== */

type CobrancaAsaas = { id: string; invoiceUrl: string; status: string };

/** Definido em site.ts para a tela poder usar sem importar este arquivo. */
const VALOR_MINIMO_COBRANCA = site.valorMinimoCobranca;

export async function criarCobranca(dados: {
  clienteId: string;
  pedidoId: string;
  valor: number;
  descricao: string;
}): Promise<Resposta<{ id: string; url: string }>> {
  if (dados.valor < VALOR_MINIMO_COBRANCA) {
    return {
      ok: false,
      erro: `o Asaas não cobra menos de R$ ${VALOR_MINIMO_COBRANCA},00 e o pedido ficou em R$ ${dados.valor.toFixed(2).replace(".", ",")}`,
    };
  }

  // Vence junto com a reserva de estoque: não faz sentido manter cobrança
  // aberta de peça que já voltou para a loja.
  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() + 1);

  const r = await chamar<CobrancaAsaas>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: dados.clienteId,
      // UNDEFINED deixa o cliente escolher entre Pix, boleto e cartão na
      // própria página do Asaas, em vez de a gente decidir por ele.
      billingType: "UNDEFINED",
      value: Number(dados.valor.toFixed(2)),
      dueDate: vencimento.toISOString().slice(0, 10),
      description: dados.descricao,
      // É por aqui que o pedido é reencontrado se precisar conferir na mão.
      externalReference: dados.pedidoId,
    }),
  });

  if (!r.ok) return { ok: false, erro: r.erro };
  return { ok: true, dados: { id: r.dados.id, url: r.dados.invoiceUrl } };
}

/**
 * Cancela a cobrança.
 *
 * Cancelar o pedido no Precifica devolvia as peças ao estoque mas deixava a
 * cobrança viva no Asaas — o cliente ainda conseguia pagar algo que a loja já
 * tinha desfeito, e você precisava lembrar de cancelar nos dois lugares.
 */
export async function cancelarCobranca(
  cobrancaId: string,
): Promise<Resposta<{ cancelada: boolean }>> {
  const r = await chamar<{ deleted?: boolean }>(`/payments/${cobrancaId}`, {
    method: "DELETE",
  });

  if (!r.ok) {
    // Cobrança já paga não pode ser apagada, e isso não é falha de código: é
    // o Asaas protegendo um pagamento que existiu de verdade. Quem chama trata
    // como aviso, não como erro.
    return { ok: false, erro: r.erro };
  }
  return { ok: true, dados: { cancelada: r.dados?.deleted !== false } };
}

/** Texto que o cliente vê na fatura. */
export function descricaoDoPedido(
  pedidoId: string,
  itens: { nome?: string; quantidade?: number }[],
) {
  const partes = itens
    .map((i) => `${i.quantidade ?? 1}x ${i.nome ?? "peça"}`)
    .join(", ");
  const texto = `${site.name} · pedido ${pedidoId} — ${partes}`;
  // O Asaas corta descrição muito longa; melhor cortar bonito aqui.
  return texto.length > 480 ? `${texto.slice(0, 477)}...` : texto;
}
