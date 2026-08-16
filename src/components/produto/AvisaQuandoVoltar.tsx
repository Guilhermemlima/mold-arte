"use client";

import { useState } from "react";
import { site, whatsappLink } from "@/lib/site";

/**
 * Fila de espera de uma peça esgotada.
 *
 * Antes, quem chegava numa peça sem estoque só via um recado mandando chamar
 * no WhatsApp. Funciona, mas depende de a pessoa tomar a iniciativa — e você
 * fica sem saber quantas queriam aquela peça. Aqui ela deixa o e-mail em dois
 * segundos, e você passa a ter a lista de quem esperar para produzir de novo.
 */
export default function AvisaQuandoVoltar({
  slug,
  nome,
}: {
  slug: string;
  nome: string;
}) {
  const [email, setEmail] = useState("");
  const [isca, setIsca] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setErro("");

    try {
      // Reaproveita o caminho do contato: a mensagem cai na sua caixa e fica
      // gravada. Uma tabela nova só para isso seria uma peça a mais para
      // manter, e o volume não pede.
      const r = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "contato",
          nome: "Fila de espera",
          email,
          assunto: `Avisar quando voltar: ${nome}`,
          mensagem: `Quer ser avisado quando "${nome}" (${slug}) voltar ao estoque.`,
          site: isca,
        }),
      });
      const dados = await r.json();
      if (!r.ok || !dados.ok) throw new Error(dados.recado ?? "Não consegui anotar.");
      setPronto(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não consegui anotar.");
    } finally {
      setEnviando(false);
    }
  };

  if (pronto) {
    return (
      <p className="mt-3 rounded-xl border border-cyan-400/25 bg-cyan-400/5 px-4 py-3.5 text-sm leading-relaxed text-silver-200">
        Anotado. Quando <strong className="text-white">{nome}</strong> voltar, a
        gente te avisa em <strong className="text-white">{email}</strong>. Se não
        quiser esperar, dá para encomendar pelo WhatsApp.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-red-400/25 bg-red-400/5 px-4 py-4">
      <p className="text-sm leading-relaxed text-silver-200">
        Esta peça está sem estoque no momento. Deixe seu e-mail que a gente
        avisa assim que voltar — ou{" "}
        <a
          href={whatsappLink(
            `Olá! O produto "${nome}" está esgotado no site. Consegue produzir um para mim?`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-cyan-400 underline"
        >
          encomende uma sob medida
        </a>
        .
      </p>

      <form onSubmit={enviar} className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`espera-${slug}`} className="sr-only">
          Seu e-mail para ser avisado
        </label>
        <input
          id={`espera-${slug}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          className="w-full flex-1 rounded-lg border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-cyan-400/60"
        />
        {/* Isca para robô: fora da tela e fora do Tab. */}
        <input
          type="text"
          name="site"
          value={isca}
          onChange={(event) => setIsca(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />
        <button
          type="submit"
          disabled={enviando}
          className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? "Anotando..." : "Me avise"}
        </button>
      </form>

      {erro && (
        <p role="alert" className="mt-2.5 text-xs text-red-200">
          {erro} Se preferir, chame no WhatsApp {site.contact.whatsappLabel}.
        </p>
      )}
    </div>
  );
}
