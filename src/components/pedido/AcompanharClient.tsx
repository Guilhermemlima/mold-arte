"use client";

import { useState } from "react";
import Link from "next/link";
import { brl, cx } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

/**
 * Acompanhamento do pedido.
 *
 * A pessoa digita o número e o e-mail da compra. Não existe conta nem senha:
 * ninguém cria cadastro para saber se a peça já saiu, e guardar senha traria
 * uma responsabilidade que esta loja não precisa ter.
 */

type Item = {
  nome?: string;
  slug?: string;
  quantidade?: number;
  tamanho?: string | null;
  total?: number;
};

type Pedido = {
  id: string;
  status: string;
  criadoEm: string;
  pagoEm: string | null;
  enviadoEm: string | null;
  itens: Item[];
  subtotal: number;
  frete: number;
  total: number;
  rastreio: string | null;
  cidade: string | null;
  uf: string | null;
  pagamentoUrl: string | null;
};

/* As etapas que o cliente enxerga. "reservado" aparece como "aguardando
   pagamento" porque é isso que ele precisa fazer — a palavra do banco não
   ajuda ninguém. */
const ETAPAS = [
  { chave: "reservado", titulo: "Pedido recebido", texto: "Estamos aguardando o pagamento." },
  { chave: "pago", titulo: "Pagamento confirmado", texto: "Sua peça entrou na fila de produção." },
  { chave: "enviado", titulo: "A caminho", texto: "Despachado — já pode acompanhar pelo rastreio." },
  { chave: "entregue", titulo: "Entregue", texto: "Chegou. Esperamos que tenha gostado!" },
] as const;

function etapaAtual(p: Pedido) {
  if (p.status === "entregue") return 3;
  if (p.rastreio) return 2;
  if (p.status === "pago") return 1;
  return 0;
}

const dia = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : null;

/**
 * A mensagem de cancelamento, pronta para enviar.
 *
 * Vai pelo WhatsApp de propósito: cancelar depois de pago mexe com dinheiro
 * saindo, e isso é decisão sua, não de um botão. O que a tela faz é tirar o
 * atrito e o mal-entendido — a mensagem chega com o número do pedido, o que
 * foi comprado e em que etapa está, então você já abre sabendo do que se
 * trata, em vez de começar por "qual é o seu pedido?".
 */
function mensagemDeCancelamento(p: Pedido) {
  const pecas = p.itens
    .map((i) => `${i.quantidade ?? 1}x ${i.nome ?? i.slug}`)
    .join(", ");

  // "entregue" vem antes do rastreio: pedido entregue continua tendo código
  // de rastreio, e checar o código primeiro fazia ele dizer "está a caminho"
  // para quem já recebeu a peça.
  const situacao =
    p.status === "entregue"
      ? "Já recebi o pedido"
      : p.status === "reservado"
        ? "Ainda não paguei"
        : p.rastreio
          ? "Já paguei e o pedido está a caminho"
          : "Já paguei";

  const querO =
    p.status === "entregue"
      ? "gostaria de devolver a compra"
      : "gostaria de cancelar a compra";

  return (
    `Olá! Fiz o pedido ${p.id} no site e ${querO}.\n\n` +
    `Peças: ${pecas}\n` +
    `Situação: ${situacao}\n\n` +
    `Pode me ajudar?`
  );
}

export default function AcompanharClient() {
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [pedido, setPedido] = useState<Pedido | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buscando) return;

    setBuscando(true);
    setErro("");
    setPedido(null);

    try {
      const r = await fetch("/api/pedido/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), email: email.trim() }),
      });
      const dados = await r.json();
      if (!r.ok || !dados.ok) throw new Error(dados.recado ?? "Não achei esse pedido.");
      setPedido(dados as Pedido);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não consegui consultar.");
    } finally {
      setBuscando(false);
    }
  };

  if (pedido) {
    const atual = etapaAtual(pedido);
    const cancelado = pedido.status === "cancelado" || pedido.status === "expirado";

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="glass border-glow rounded-3xl p-7 sm:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/8 pb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400">
                Pedido
              </p>
              <p className="font-display text-xl font-bold text-white tabular-nums">
                {pedido.id}
              </p>
            </div>
            <p className="text-xs text-silver-400">
              Feito em {dia(pedido.criadoEm)}
              {pedido.cidade && ` · ${pedido.cidade}${pedido.uf ? ` - ${pedido.uf}` : ""}`}
            </p>
          </div>

          {cancelado ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 px-5 py-4">
              <p className="font-display text-sm font-semibold text-white">
                Este pedido foi cancelado
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-silver-400">
                Se foi engano ou se você ainda quer as peças, chame a gente no
                WhatsApp que a gente refaz.
              </p>
            </div>
          ) : (
            <ol className="mt-7 space-y-0">
              {ETAPAS.map((etapa, i) => {
                const feito = i <= atual;
                const agora = i === atual;
                return (
                  <li key={etapa.chave} className="flex gap-4">
                    {/* Trilho */}
                    <div className="flex flex-col items-center">
                      <span
                        className={cx(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                          feito
                            ? "border-cyan-400 bg-cyan-400/15 text-cyan-400"
                            : "border-white/15 text-muted",
                        )}
                      >
                        {feito ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 13 4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      {i < ETAPAS.length - 1 && (
                        <span
                          className={cx(
                            "w-px flex-1",
                            i < atual ? "bg-cyan-400/50" : "bg-white/10",
                          )}
                        />
                      )}
                    </div>

                    <div className={cx("pb-7", i === ETAPAS.length - 1 && "pb-0")}>
                      <p
                        className={cx(
                          "font-display text-sm font-semibold",
                          agora ? "text-cyan-300" : feito ? "text-white" : "text-silver-400",
                        )}
                      >
                        {etapa.titulo}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-silver-400">
                        {etapa.texto}
                      </p>
                      {etapa.chave === "pago" && pedido.pagoEm && (
                        <p className="mt-1 text-[11px] text-muted">{dia(pedido.pagoEm)}</p>
                      )}
                      {etapa.chave === "enviado" && pedido.rastreio && (
                        <div className="mt-2.5">
                          <p className="font-mono text-sm font-semibold text-white">
                            {pedido.rastreio}
                          </p>
                          <a
                            href={`https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(pedido.rastreio)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 underline"
                          >
                            Rastrear nos Correios
                          </a>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Pagar, quando ainda falta */}
          {pedido.pagamentoUrl && !cancelado && (
            <a
              href={pedido.pagamentoUrl}
              className="mt-4 flex w-full items-center justify-center rounded-full bg-white px-8 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
            >
              Pagar agora
            </a>
          )}
        </div>

        {/* Itens */}
        <div className="glass rounded-3xl border border-white/10 p-7 sm:p-9">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
            O que você pediu
          </h2>
          <ul className="mt-5 space-y-3">
            {pedido.itens.map((item, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-silver-200">
                  {item.quantidade ?? 1}× {item.nome ?? item.slug}
                  {item.tamanho && item.tamanho !== "Único" && (
                    <span className="text-muted"> ({item.tamanho})</span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-silver-400">
                  {brl(item.total ?? 0)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-1.5 border-t border-white/8 pt-4 text-sm">
            <div className="flex justify-between text-silver-400">
              <span>Frete</span>
              <span className="tabular-nums">
                {pedido.frete > 0 ? brl(pedido.frete) : "grátis"}
              </span>
            </div>
            <div className="flex justify-between font-display font-bold text-white">
              <span>Total</span>
              <span className="tabular-nums">{brl(pedido.total)}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs leading-relaxed text-silver-400">
          Alguma dúvida sobre este pedido?{" "}
          <a
            href={whatsappLink(`Olá! Queria falar sobre o pedido ${pedido.id}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-cyan-400 underline"
          >
            Chame no WhatsApp {site.contact.whatsappLabel}
          </a>
        </p>

        {/* Cancelar fica discreto e por último, nunca competindo com o botão
            de pagar. Some em pedido já cancelado, que não tem o que cancelar. */}
        {!cancelado && (
          <div className="border-t border-white/8 pt-6 text-center">
            <a
              href={whatsappLink(mensagemDeCancelamento(pedido))}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted underline transition-colors hover:text-silver-200"
            >
              {pedido.status === "entregue"
                ? "Quero devolver este pedido"
                : "Quero cancelar este pedido"}
            </a>
            <p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-muted">
              {pedido.status === "reservado"
                ? "Ainda não pago: é só avisar que a gente libera as peças e encerra o pedido."
                : "Abre uma conversa no WhatsApp com os dados do pedido já preenchidos. Você tem 7 dias corridos após receber para desistir da compra."}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setPedido(null)}
          className="mx-auto block rounded-full border border-white/15 px-6 py-2.5 text-sm text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
        >
          Consultar outro pedido
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={buscar} className="glass border-glow mx-auto max-w-lg rounded-3xl p-7 sm:p-9">
      <div className="space-y-5">
        <div>
          <label
            htmlFor="num-pedido"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-silver-400"
          >
            Número do pedido
          </label>
          <input
            id="num-pedido"
            value={id}
            onChange={(e) => setId(e.target.value.toUpperCase())}
            placeholder="MA3D-XXXXXX"
            required
            className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-cyan-400/60"
          />
          <p className="mt-1.5 text-[11px] text-muted">
            Está no e-mail de confirmação que você recebeu.
          </p>
        </div>

        <div>
          <label
            htmlFor="email-pedido"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-silver-400"
          >
            E-mail da compra
          </label>
          <input
            id="email-pedido"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-cyan-400/60"
          />
        </div>
      </div>

      {erro && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/8 px-5 py-3.5 text-sm leading-relaxed text-red-200"
        >
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={buscando}
        className="mt-7 w-full rounded-full bg-white px-8 py-3.5 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
      >
        {buscando ? "Procurando..." : "Ver meu pedido"}
      </button>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
        Não achou o e-mail de confirmação? Chame no WhatsApp{" "}
        <a
          href={whatsappLink("Olá! Queria saber como está meu pedido.")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-silver-400 underline"
        >
          {site.contact.whatsappLabel}
        </a>{" "}
        que a gente procura para você.
      </p>

      <Link
        href="/loja"
        className="mt-6 block text-center text-xs text-silver-400 transition-colors hover:text-cyan-300"
      >
        Voltar para a loja
      </Link>
    </form>
  );
}
