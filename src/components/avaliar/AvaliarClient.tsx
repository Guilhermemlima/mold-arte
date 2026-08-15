"use client";

import { useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

type Item = { slug: string; nome: string; tamanho: string | null };

/**
 * Formulário de avaliação, uma peça por vez.
 *
 * Só a nota é obrigatória. Exigir texto faria a maioria desistir na metade — e
 * uma nota sem comentário ainda vale mais do que nenhuma avaliação.
 */
export default function AvaliarClient({
  chave,
  itens,
}: {
  chave: string;
  itens: Item[];
}) {
  const [feitas, setFeitas] = useState<Record<string, boolean>>({});

  if (!itens.length) {
    return (
      <div className="glass border-glow mx-auto max-w-xl rounded-3xl p-8 text-center text-sm text-silver-400">
        Não achei as peças deste pedido para avaliar.
      </div>
    );
  }

  const tudoFeito = itens.every((i) => feitas[i.slug]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {itens.map((item) => (
        <UmaPeca
          key={item.slug}
          chave={chave}
          item={item}
          pronta={Boolean(feitas[item.slug])}
          aoEnviar={() => setFeitas((p) => ({ ...p, [item.slug]: true }))}
        />
      ))}

      {tudoFeito && (
        <div className="glass border-glow rounded-3xl p-8 text-center">
          <p className="text-sm leading-relaxed text-silver-400">
            Obrigado de verdade. Sua avaliação passa por uma conferência rápida
            antes de aparecer na página da peça — só para segurar spam, não para
            escolher nota.
          </p>
          <Link
            href="/loja"
            className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
          >
            Ver a loja
          </Link>
        </div>
      )}
    </div>
  );
}

function UmaPeca({
  chave,
  item,
  pronta,
  aoEnviar,
}: {
  chave: string;
  item: Item;
  pronta: boolean;
  aoEnviar: () => void;
}) {
  const [nota, setNota] = useState(0);
  const [passando, setPassando] = useState(0);
  const [nome, setNome] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    if (!nota) {
      setErro("Escolha de 1 a 5 estrelas.");
      return;
    }

    setEnviando(true);
    setErro("");

    try {
      const r = await fetch("/api/avaliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, slug: item.slug, nota, nome, comentario }),
      });
      const dados = await r.json();
      if (!r.ok || !dados.ok) {
        throw new Error(dados.recado ?? "Não consegui salvar sua avaliação.");
      }
      aoEnviar();
    } catch (erroDoEnvio) {
      setErro(
        erroDoEnvio instanceof Error
          ? erroDoEnvio.message
          : "Não consegui salvar sua avaliação.",
      );
    } finally {
      setEnviando(false);
    }
  };

  if (pronta) {
    return (
      <div className="glass rounded-3xl border border-cyan-400/25 bg-cyan-400/5 p-6">
        <p className="flex items-center gap-3 text-sm font-medium text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
            <path d="m5 13 4 4L19 7" />
          </svg>
          {item.nome} — avaliada
        </p>
      </div>
    );
  }

  // A estrela acesa segue o mouse enquanto ele passa, e volta para a nota
  // escolhida quando sai.
  const aceso = passando || nota;

  return (
    <form onSubmit={enviar} className="glass border-glow rounded-3xl p-7 sm:p-8">
      <h2 className="font-display text-lg font-bold text-white">{item.nome}</h2>
      {item.tamanho && item.tamanho !== "Único" && (
        <p className="mt-0.5 text-xs text-muted">Tamanho {item.tamanho}</p>
      )}

      {/* Estrelas */}
      <div
        className="mt-5 flex items-center gap-1.5"
        onMouseLeave={() => setPassando(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNota(n)}
            onMouseEnter={() => setPassando(n)}
            aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
            aria-pressed={nota === n}
            className="p-0.5 transition-transform duration-200 hover:scale-115"
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              strokeWidth="1.6"
              stroke="currentColor"
              className={cx(
                "transition-colors duration-200",
                n <= aceso ? "fill-cyan-400 text-cyan-400" : "fill-transparent text-white/25",
              )}
            >
              <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-xs text-muted">
          {aceso ? `${aceso} de 5` : "toque para dar a nota"}
        </span>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor={`nome-${item.slug}`}
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-silver-400"
          >
            Como quer assinar
          </label>
          <input
            id={`nome-${item.slug}`}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu primeiro nome"
            maxLength={60}
            className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-cyan-400/60"
          />
          <p className="mt-1.5 text-[11px] text-muted">
            Deixe em branco para usar o primeiro nome do pedido. Não publicamos
            sobrenome, e-mail nem telefone.
          </p>
        </div>

        <div>
          <label
            htmlFor={`texto-${item.slug}`}
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-silver-400"
          >
            Quer contar mais? <span className="normal-case text-muted">(opcional)</span>
          </label>
          <textarea
            id={`texto-${item.slug}`}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            maxLength={1500}
            placeholder="O acabamento, o tamanho, se chegou bem embalada, se serviu para o que você queria…"
            className="w-full resize-y rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-muted focus:border-cyan-400/60"
          />
        </div>
      </div>

      {erro && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/8 px-5 py-3.5 text-sm text-red-200"
        >
          {erro}{" "}
          <a
            href={whatsappLink("Olá! Tentei avaliar minha compra pelo site e deu erro.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            {site.contact.whatsappLabel}
          </a>
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-7 w-full rounded-full bg-white px-8 py-3.5 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:shadow-none"
      >
        {enviando ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
