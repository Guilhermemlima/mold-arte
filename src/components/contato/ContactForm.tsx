"use client";

import { useState } from "react";
import Field from "@/components/checkout/Field";
import { cx } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

const subjects = [
  "Dúvida sobre um produto",
  "Status do meu pedido",
  "Orçamento personalizado",
  "Compra em lote / corporativo",
  "Troca ou devolução",
  "Outro assunto",
];

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  // Campo invisível: robô preenche tudo, gente preenche o que vê.
  const [isca, setIsca] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setErro("");

    try {
      const r = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "contato",
          nome: form.name,
          email: form.email,
          telefone: form.phone,
          assunto: subject,
          mensagem: form.message,
          site: isca,
        }),
      });

      const dados = await r.json();
      if (!r.ok || !dados.ok) {
        throw new Error(dados.recado ?? "Não consegui enviar sua mensagem.");
      }

      setSent(true);
    } catch (e) {
      // Só diz "enviada" quando foi enviada mesmo. Antes esta tela mentia.
      setErro(e instanceof Error ? e.message : "Não consegui enviar sua mensagem.");
    } finally {
      setEnviando(false);
    }
  };

  if (sent) {
    return (
      <div className="glass border-glow rounded-3xl p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-400">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-white">
          Mensagem enviada
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-silver-400">
          Obrigado, {form.name.split(" ")[0]}! Respondemos em{" "}
          <strong className="text-white">{form.email}</strong> em até 24 horas
          úteis.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", phone: "", message: "" });
          }}
          className="mt-7 rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass border-glow rounded-3xl p-7 sm:p-9">
      <h2 className="font-display text-xl font-bold text-white">
        Mande sua mensagem
      </h2>
      <p className="mt-1.5 text-sm text-silver-400">
        Preenche aí que a gente responde rapidinho.
      </p>

      {/* Assunto */}
      <fieldset className="mt-7">
        <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-silver-400">
          Assunto
        </legend>
        <div className="flex flex-wrap gap-2">
          {subjects.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSubject(item)}
              aria-pressed={subject === item}
              className={cx(
                "rounded-full border px-3.5 py-2 text-xs transition-all duration-300",
                subject === item
                  ? "border-cyan-400 bg-cyan-400/10 text-white"
                  : "border-white/12 text-silver-400 hover:border-white/25 hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 space-y-6">
        <Field
          label="Nome"
          value={form.name}
          onChange={(v) => update("name", v)}
          placeholder="Seu nome"
          required
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="seu@email.com"
            required
          />
          <Field
            label="WhatsApp"
            type="tel"
            value={form.phone}
            onChange={(v) => update("phone", v)}
            placeholder="(00) 00000-0000"
            hint="Opcional, mas acelera"
          />
        </div>
        <Field
          label="Mensagem"
          value={form.message}
          onChange={(v) => update("message", v)}
          placeholder="Conte o que você precisa…"
          multiline
          required
        />
      </div>

      {/* Isca para robô: fora da tela e fora do Tab. */}
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

      {erro && (
        <p
          role="alert"
          className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/8 px-5 py-4 text-sm text-red-200"
        >
          {erro} Se insistir, fale com a gente pelo WhatsApp{" "}
          <a
            href={whatsappLink("Olá! Tentei mandar uma mensagem pelo site e deu erro.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            {site.contact.whatsappLabel}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:shadow-none"
      >
        {enviando ? "Enviando..." : "Enviar mensagem"}
        {!enviando && (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </form>
  );
}
