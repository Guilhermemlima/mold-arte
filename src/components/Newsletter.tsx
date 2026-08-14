"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Campo invisível: robô preenche tudo, gente preenche o que vê.
  const [isca, setIsca] = useState("");
  const toast = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      const r = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "novidades", email, site: isca }),
      });

      const dados = await r.json();
      if (!r.ok || !dados.ok) {
        throw new Error(dados.recado ?? "Não consegui cadastrar seu e-mail.");
      }

      setSent(true);
      setEmail("");
      toast({
        title: dados.jaEstava ? "Você já está na lista" : "Inscrição confirmada",
        description: dados.jaEstava
          ? "Esse e-mail já recebe as novidades."
          : "Você vai receber os lançamentos em primeira mão.",
      });
    } catch (e) {
      // Confirmar uma inscrição que não foi gravada só cria a expectativa de
      // um e-mail que nunca vai chegar.
      toast({
        title: "Não consegui cadastrar",
        description: e instanceof Error ? e.message : "Tente de novo em instantes.",
        variant: "error",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-8 py-14 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div>
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-400">
          <span className="h-px w-8 bg-cyan-400" />
          Novidades
        </p>
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
          Peça nova toda semana.
          <br />
          <span className="text-gradient">Você vê primeiro.</span>
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-silver-400">
          Lançamentos, bastidores da produção e cupons que só vão para a lista.
          Sem spam — e você sai quando quiser.
        </p>
      </div>

      <form onSubmit={submit} className="w-full">
        <div className="glass border-glow flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center">
          <label htmlFor="newsletter-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted"
          />
          <input
            type="text"
            name="site"
            value={isca}
            onChange={(e) => setIsca(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />
          <button
            type="submit"
            disabled={enviando}
            className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Enviando..." : sent ? "Inscrito ✓" : "Quero receber"}
          </button>
        </div>
        <p className="mt-2.5 px-1 text-[11px] text-muted">
          Ao se inscrever você concorda em receber e-mails da Moldarte 3D.
        </p>
      </form>
    </div>
  );
}
