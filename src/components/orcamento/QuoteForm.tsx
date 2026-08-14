"use client";

import { useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { cx } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import Field from "@/components/checkout/Field";

const materials = ["Não sei / me indiquem", "PLA", "PETG", "ABS", "Resina", "Nylon"];
const finishes = [
  "Direto da impressora",
  "Lixado",
  "Lixado e pintado",
  "Pintura especial (metálico, gradiente)",
];
const deadlines = ["Sem pressa", "Até 7 dias", "Até 3 dias", "É urgente"];

const ACCEPTED = ".stl,.obj,.3mf,.step,.stp,.pdf,.png,.jpg,.jpeg";
const MAX_MB = 50;

export default function QuoteForm() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sent, setSent] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [avisado, setAvisado] = useState(false);
  const [enviando, setEnviando] = useState("");
  const [erro, setErro] = useState("");
  // Agrupa os arquivos deste envio numa pasta só, para eles não ficarem
  // espalhados no balde sem nada dizendo que são do mesmo projeto.
  const pasta = useRef(Math.random().toString(36).slice(2, 12));
  // Campo invisível: robô preenche tudo que encontra, gente preenche o que vê.
  const [isca, setIsca] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    quantity: "1",
    description: "",
  });
  const [material, setMaterial] = useState(materials[0]);
  const [finish, setFinish] = useState(finishes[0]);
  const [deadline, setDeadline] = useState(deadlines[0]);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);

    const tooBig = incoming.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: `O limite é ${MAX_MB} MB por arquivo.`,
        variant: "error",
      });
    }

    const accepted = incoming.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted].slice(0, 5));
      toast({
        title: `${accepted.length} ${accepted.length === 1 ? "arquivo anexado" : "arquivos anexados"}`,
      });
    }
  };

  /**
   * Sobe um arquivo direto no Supabase.
   *
   * O servidor só assina a permissão; o arquivo vai daqui para lá sem passar
   * pela nossa API. É o que permite mandar um STL de 40 MB — pela rota normal
   * ele bateria no limite de tamanho da hospedagem e o envio morreria bem nos
   * projetos maiores.
   */
  const sobe = async (file: File) => {
    const permissao = await fetch("/api/orcamento/arquivo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: file.name,
        tamanho: file.size,
        pasta: pasta.current,
      }),
    });

    const dados = await permissao.json();
    if (!permissao.ok || !dados.ok) {
      throw new Error(dados.recado ?? `Não consegui enviar "${file.name}".`);
    }

    const envio = await fetch(dados.url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!envio.ok) throw new Error(`O envio de "${file.name}" falhou no meio.`);

    return { nome: file.name, caminho: dados.caminho, tamanho: file.size };
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (enviando) return;

    setErro("");

    try {
      const anexos = [];
      for (let i = 0; i < files.length; i += 1) {
        setEnviando(`Enviando arquivo ${i + 1} de ${files.length}...`);
        // Um de cada vez: são arquivos grandes, e mandar tudo junto numa
        // conexão de celular costuma derrubar todos em vez de nenhum.
        anexos.push(await sobe(files[i]));
      }

      setEnviando("Registrando seu pedido...");

      const r = await fetch("/api/orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.name,
          email: form.email,
          telefone: form.phone,
          quantidade: form.quantity,
          material,
          acabamento: finish,
          prazo: deadline,
          descricao: form.description,
          arquivos: anexos,
          site: isca,
        }),
      });

      const dados = await r.json();
      if (!r.ok || !dados.ok) {
        throw new Error(dados.recado ?? "Não consegui registrar seu pedido.");
      }

      setProtocolo(dados.id);
      setAvisado(Boolean(dados.avisoAoCliente));
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      // Falhou de verdade, e a tela diz isso. Mostrar "recebemos seu projeto"
      // sem ter recebido foi exatamente o defeito que este formulário tinha.
      const recado = e instanceof Error ? e.message : "Não consegui enviar.";
      setErro(recado);
      toast({ title: "Não consegui enviar", description: recado, variant: "error" });
    } finally {
      setEnviando("");
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
          Recebemos seu projeto
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-silver-400">
          Sua solicitação é a{" "}
          <strong className="text-white tabular-nums">{protocolo}</strong>. Vamos
          analisar e responder em até 24 horas úteis
          {avisado ? (
            <>
              {" "}
              no e-mail <strong className="text-white">{form.email}</strong>
            </>
          ) : (
            // Sem confirmação enviada, prometer e-mail seria repetir o erro
            // antigo em outra escala: o WhatsApp é o canal que funciona.
            <> no WhatsApp <strong className="text-white">{form.phone}</strong></>
          )}
          .
        </p>
        <a
          href={whatsappLink(
            `Olá! Acabei de enviar o pedido de orçamento ${protocolo} pelo site (${form.name}).`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
        >
          Adiantar pelo WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass border-glow rounded-3xl p-7 sm:p-9">
      {/* Upload */}
      <div>
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
          Seu arquivo ou referência
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cx(
            "mt-3 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300",
            dragging
              ? "border-cyan-400 bg-cyan-400/8"
              : "border-white/15 hover:border-cyan-400/40 hover:bg-white/2",
          )}
        >
          <span
            className={cx(
              "flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 transition-transform duration-300",
              dragging ? "scale-110 text-cyan-400" : "text-silver-400",
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M8 8l4-4 4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              Arraste aqui ou clique para escolher
            </span>
            <span className="mt-1 block text-xs text-silver-400">
              STL, OBJ, 3MF, STEP, PDF ou imagem · até {MAX_MB} MB cada
            </span>
          </span>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            onChange={(e) => addFiles(e.target.files)}
            className="sr-only"
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-cyan-400">
                  <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
                  <path d="M13 3v6h6" />
                </svg>
                <span className="min-w-0 flex-1 truncate text-xs text-silver-200">
                  {file.name}
                </span>
                <span className="shrink-0 text-[11px] text-muted tabular-nums">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remover ${file.name}`}
                  className="shrink-0 text-silver-400 transition-colors hover:text-red-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2.5 text-[11px] text-muted">
          Sem arquivo? Tudo bem — descreva a peça no campo abaixo que a gente
          modela.
        </p>
      </div>

      {/* Especificações */}
      <div className="mt-9 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Select
            label="Material"
            value={material}
            options={materials}
            onChange={setMaterial}
          />
          <Select
            label="Acabamento"
            value={finish}
            options={finishes}
            onChange={setFinish}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Select
            label="Prazo desejado"
            value={deadline}
            options={deadlines}
            onChange={setDeadline}
          />
          <Field
            label="Quantidade"
            type="number"
            value={form.quantity}
            onChange={(v) => update("quantity", v)}
            placeholder="1"
          />
        </div>

        <Field
          label="Descreva o projeto"
          value={form.description}
          onChange={(v) => update("description", v)}
          placeholder="Ex.: preciso de uma engrenagem de reposição de 6 cm de diâmetro para um liquidificador. Tenho a peça quebrada e posso mandar foto com régua."
          hint="Quanto mais detalhe, mais preciso fica o orçamento"
          multiline
          required
        />
      </div>

      {/* Contato */}
      <div className="mt-9 space-y-6 border-t border-white/8 pt-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
          Como falamos com você
        </p>
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
            required
          />
        </div>
      </div>

      {/* Isca para robô: fora da tela, sem chegar pelo Tab, e o navegador
          avisado para não preencher sozinho. */}
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
          {erro} Se continuar assim, chame no WhatsApp{" "}
          <a href={whatsappLink("Olá! Tentei mandar um orçamento pelo site e deu erro.")} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            {site.contact.whatsappLabel}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={Boolean(enviando)}
        className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:shadow-none"
      >
        {enviando || "Enviar para orçamento"}
        {!enviando && (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] text-muted">
        Resposta em até 24h úteis · seu arquivo não é compartilhado com ninguém
      </p>
    </form>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-silver-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
