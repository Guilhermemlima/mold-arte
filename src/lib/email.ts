import { site } from "./site";

/**
 * Envio de e-mail pelo Resend.
 *
 * Sem biblioteca: é uma chamada HTTP só, e uma dependência a menos para
 * manter. Roda apenas no servidor — a chave nunca chega ao navegador.
 *
 * Nada aqui pode derrubar um pedido. Se o e-mail falhar, a venda continua
 * registrada e o estoque reservado; o que se perde é o aviso, não a compra.
 */

const chave = process.env.RESEND_API_KEY;

/**
 * Remetente. Enquanto você não tiver um domínio próprio verificado no Resend,
 * o único remetente permitido é o de teste deles — e ele só consegue entregar
 * no e-mail da sua conta. Na prática: o aviso para você funciona; a
 * confirmação para o cliente só passa a sair depois do domínio.
 */
const remetente = process.env.EMAIL_REMETENTE ?? "Moldarte 3D <onboarding@resend.dev>";
const lojista = process.env.EMAIL_LOJISTA ?? site.contact.email;

export const emailConfigurado = Boolean(chave);

async function envia(para: string, assunto: string, html: string) {
  if (!chave) {
    console.warn(
      "[email] RESEND_API_KEY não configurada — nenhum aviso de pedido será enviado.",
    );
    return false;
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: remetente, to: [para], subject: assunto, html }),
      // O cliente está esperando a tela de confirmação: não vale segurar o
      // pedido porque um servidor de e-mail demorou.
      signal: AbortSignal.timeout(6000),
    });

    if (!r.ok) {
      console.error(`[email] Resend recusou (${r.status}): ${await r.text()}`);
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[email] Falhou ao enviar:", erro);
    return false;
  }
}

/* ==========================================================================
   Modelos
   ========================================================================== */

const dinheiro = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type ItemDoPedido = {
  nome?: string;
  slug?: string;
  tamanho?: string | null;
  quantidade?: number;
  precoUnitario?: number;
  total?: number;
};

type Pedido = {
  id: string;
  itens: ItemDoPedido[];
  subtotal: number;
  frete: number;
  total: number;
  pagamento?: string | null;
  cliente: Record<string, string>;
  entrega: Record<string, string>;
  observacoes?: string | null;
  /** Página de pagamento, quando a cobrança foi gerada. */
  pagamentoUrl?: string | null;
};

function tabelaDeItens(itens: ItemDoPedido[]) {
  const linhas = itens
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">
          ${i.quantidade}× ${i.nome ?? i.slug ?? "peça"}
          ${i.tamanho && i.tamanho !== "Único" ? `<br><span style="color:#777;font-size:12px">${i.tamanho}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">
          ${dinheiro(i.total ?? 0)}
        </td>
      </tr>`,
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${linhas}</table>`;
}

function moldura(titulo: string, corpo: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#0a1424;color:#fff;padding:20px 24px">
        <div style="font-size:18px;font-weight:bold;letter-spacing:2px">MOLDARTE <span style="color:#38d8f5">3D</span></div>
        <div style="font-size:13px;color:#8ba0b8;margin-top:4px">${titulo}</div>
      </div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">${corpo}</div>
      <div style="padding:16px 24px;background:#f0f2f5;color:#777;font-size:12px">
        ${site.name} · ${site.contact.whatsappLabel} · ${site.contact.email}
      </div>
    </div>
  </div>`;
}

/** Aviso para você, com tudo que precisa para produzir e entregar. */
export function avisaLojista(p: Pedido) {
  const c = p.cliente ?? {};
  const e = p.entrega ?? {};
  const endereco = [
    [e.rua, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join(" - "),
    e.cep,
  ]
    .filter(Boolean)
    .join("<br>");

  const corpo = `
    <p style="margin:0 0 16px"><b>Pedido ${p.id}</b> — ${dinheiro(p.total)}</p>
    ${tabelaDeItens(p.itens)}
    <table style="width:100%;font-size:14px;margin-top:12px">
      <tr><td style="padding:4px 0">Frete</td><td style="text-align:right">${dinheiro(p.frete)}</td></tr>
      <tr><td style="padding:4px 0"><b>Total</b></td><td style="text-align:right"><b>${dinheiro(p.total)}</b></td></tr>
    </table>

    <p style="margin:20px 0 6px"><b>Cliente</b></p>
    <p style="margin:0;color:#444">
      ${c.nome ?? "—"}<br>
      ${c.email ?? "—"}<br>
      ${c.telefone ?? "—"}
      ${c.documento ? `<br>${c.documento}` : ""}
    </p>

    <p style="margin:20px 0 6px"><b>Entrega</b></p>
    <p style="margin:0;color:#444">${endereco || "—"}</p>

    ${p.observacoes ? `<p style="margin:20px 0 6px"><b>Observações</b></p><p style="margin:0;color:#444">${p.observacoes}</p>` : ""}

    ${
      p.pagamentoUrl
        ? `<p style="margin:20px 0 0;color:#777;font-size:13px">
             A cobrança foi gerada e o link de pagamento já foi enviado ao
             cliente. Quando ele pagar, o pedido vira "pago" sozinho.
           </p>`
        : `<p style="margin:20px 0 0;background:#fff4e5;border-left:4px solid #d9822b;padding:12px 14px;color:#7a4a12;font-size:13px">
             <b>Atenção: a cobrança não foi gerada.</b> O cliente foi orientado
             a combinar o pagamento por WhatsApp — ele está esperando seu
             contato, e não vai receber link nenhum sozinho.
           </p>`
    }
    <p style="margin:20px 0 0;color:#777;font-size:13px">
      Forma de pagamento escolhida: <b>${p.pagamento ?? "—"}</b>.
      As peças estão reservadas por 24 horas — confirme o pagamento no
      Precifica para segurar o estoque, ou cancele para devolvê-lo à loja.
    </p>`;

  return envia(lojista, `Novo pedido ${p.id} — ${dinheiro(p.total)}`, moldura("Novo pedido na loja", corpo));
}

/* ==========================================================================
   Orçamentos e mensagens
   ========================================================================== */

type Solicitacao = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  quantidade: number;
  material?: string;
  acabamento?: string;
  prazo?: string;
  descricao?: string;
  arquivos: { nome: string; tamanho: number; url?: string | null }[];
};

const emMB = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

/**
 * Texto do cliente virando HTML.
 *
 * O que ele digita entra no e-mail que você abre. Sem isto, uma descrição com
 * `<a href>` dentro chegaria como link clicável na sua caixa — e um pedido de
 * orçamento viraria um jeito barato de mandar phishing com a cara da loja.
 */
function esc(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linha(rotulo: string, valor?: string | null) {
  if (!valor) return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#777;white-space:nowrap">${rotulo}</td><td style="padding:4px 0"><b>${esc(valor)}</b></td></tr>`;
}

/** Aviso para você, com tudo que precisa para orçar sem responder pedindo dados. */
export function avisaOrcamentoAoLojista(s: Solicitacao) {
  const arquivos = s.arquivos.length
    ? s.arquivos
        .map(
          (a) =>
            `<li style="margin-bottom:6px">${
              a.url ? `<a href="${a.url}">${esc(a.nome)}</a>` : esc(a.nome)
            } <span style="color:#777;font-size:12px">(${emMB(a.tamanho)})</span></li>`,
        )
        .join("")
    : "<li style='color:#777'>Nenhum arquivo anexado.</li>";

  const corpo = `
    <p style="margin:0 0 16px"><b>Orçamento ${s.id}</b></p>
    <table style="font-size:14px">
      ${linha("Cliente", s.nome)}
      ${linha("E-mail", s.email)}
      ${linha("Telefone", s.telefone)}
      ${linha("Quantidade", String(s.quantidade))}
      ${linha("Material", s.material)}
      ${linha("Acabamento", s.acabamento)}
      ${linha("Prazo", s.prazo)}
    </table>

    ${
      s.descricao
        ? `<p style="margin:20px 0 6px"><b>O que ele quer</b></p>
           <p style="margin:0;color:#444;white-space:pre-wrap">${esc(s.descricao)}</p>`
        : ""
    }

    <p style="margin:20px 0 6px"><b>Arquivos</b></p>
    <ul style="margin:0;padding-left:18px;color:#444">${arquivos}</ul>
    <p style="margin:8px 0 0;color:#777;font-size:12px">
      Os links valem por 7 dias. Depois disso, baixe pela aba Orçamentos do
      Precifica, que gera um link novo.
    </p>

    <p style="margin:20px 0 0;color:#777;font-size:13px">
      Este pedido já está na aba <b>Orçamentos</b> do Precifica. Responda pelo
      WhatsApp por lá — o cliente está esperando retorno.
    </p>`;

  return envia(lojista, `Pedido de orçamento ${s.id} — ${s.nome}`, moldura("Novo pedido de orçamento", corpo));
}

/** Confirmação honesta para quem pediu: sem prometer prazo que não se cumpre. */
export function confirmaOrcamentoAoCliente(s: Solicitacao) {
  if (!s.email) return Promise.resolve(false);

  const corpo = `
    <p style="margin:0 0 16px">Olá, ${esc(s.nome.split(" ")[0])}! Recebemos seu projeto.</p>
    <p style="margin:0 0 16px">Número da solicitação: <b>${s.id}</b></p>
    <p style="margin:0 0 16px">
      Vamos analisar o que você mandou e responder com o preço e o prazo. Se
      alguma coisa não estiver clara no arquivo, a gente pergunta antes de
      orçar — melhor perguntar do que chutar.
    </p>
    ${
      s.arquivos.length
        ? `<p style="margin:0 0 16px">Chegaram ${s.arquivos.length} ${
            s.arquivos.length === 1 ? "arquivo" : "arquivos"
          }: ${esc(s.arquivos.map((a) => a.nome).join(", "))}.</p>`
        : ""
    }
    <p style="margin:20px 0 0">
      Quer adiantar? Chame no WhatsApp ${site.contact.whatsappLabel} e cite o
      número ${s.id}.
    </p>`;

  return envia(s.email, `Recebemos seu projeto (${s.id}) — ${site.name}`, moldura("Pedido de orçamento recebido", corpo));
}

/** Mensagem do formulário de contato. */
export function avisaContato(m: {
  nome: string;
  email?: string;
  telefone?: string;
  assunto?: string;
  mensagem: string;
}) {
  const corpo = `
    <table style="font-size:14px">
      ${linha("De", m.nome)}
      ${linha("E-mail", m.email)}
      ${linha("Telefone", m.telefone)}
      ${linha("Assunto", m.assunto)}
    </table>
    <p style="margin:20px 0 6px"><b>Mensagem</b></p>
    <p style="margin:0;color:#444;white-space:pre-wrap">${esc(m.mensagem)}</p>
    ${
      m.email
        ? `<p style="margin:20px 0 0;color:#777;font-size:13px">
             Responder este e-mail não chega no cliente — escreva para
             <b>${esc(m.email)}</b>.
           </p>`
        : ""
    }`;

  return envia(lojista, `Contato pelo site — ${m.nome.slice(0, 60)}`, moldura("Mensagem pelo site", corpo));
}

/** Confirmação para quem comprou. */
export function avisaCliente(p: Pedido) {
  const email = p.cliente?.email;
  if (!email) return Promise.resolve(false);

  const corpo = `
    <p style="margin:0 0 16px">Olá, ${p.cliente?.nome?.split(" ")[0] ?? "tudo bem"}! Recebemos seu pedido.</p>
    <p style="margin:0 0 16px">Número: <b>${p.id}</b></p>
    ${tabelaDeItens(p.itens)}
    <table style="width:100%;font-size:14px;margin-top:12px">
      <tr><td style="padding:4px 0">Frete</td><td style="text-align:right">${dinheiro(p.frete)}</td></tr>
      <tr><td style="padding:4px 0"><b>Total</b></td><td style="text-align:right"><b>${dinheiro(p.total)}</b></td></tr>
    </table>
    ${
      p.pagamentoUrl
        ? `<p style="margin:24px 0;text-align:center">
             <a href="${p.pagamentoUrl}"
                style="display:inline-block;background:#0a1424;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold">
               Pagar agora
             </a>
           </p>
           <p style="margin:0;text-align:center;color:#777;font-size:12px">
             Pix, boleto ou cartão. O link vale por 24 horas.
           </p>`
        : ""
    }
    <p style="margin:20px 0 0">
      Suas peças ficam <b>reservadas por 24 horas</b>. Assim que o pagamento for
      confirmado, a produção começa — e a gente avisa quando despachar.
    </p>
    <p style="margin:16px 0 0">
      Qualquer dúvida, é só responder este e-mail ou chamar no WhatsApp
      ${site.contact.whatsappLabel}.
    </p>`;

  return envia(email, `Pedido ${p.id} recebido — ${site.name}`, moldura("Confirmação do seu pedido", corpo));
}
