"use client";

import { useRef, useState } from "react";
import AvisoDeEmail from "@/components/AvisoDeEmail";
import Field from "@/components/checkout/Field";
import Select from "@/components/checkout/Select";
import { useToast } from "@/context/ToastContext";
import { documentoValido, formataDocumento } from "@/lib/documento";
import { site, whatsappLink } from "@/lib/site";
import { sobeArquivo, type Anexo } from "@/lib/upload";

/**
 * Pedido de brinde de empresa.
 *
 * É o mesmo caminho do orçamento sob medida — mesma rota, mesma tabela, mesmo
 * envio de arquivo —, mas as perguntas são outras. Quem pede uma peça única
 * quer saber se dá para imprimir; quem pede quinhentos chaveiros já sabe o que
 * quer e precisa de preço, prazo e prova de que a marca vai sair certa.
 *
 * Por isso aqui não se pergunta material nem acabamento: numa peça pequena com
 * logo isso é decisão de quem produz, e perguntar transferiria para o cliente
 * uma escolha que ele não tem como fazer. O que se pergunta é o que só ele
 * sabe — quantas, para quando, e com qual arte.
 */

const TIPOS = [
  "Chaveiro",
  "Ímã de geladeira",
  "Troféu ou premiação",
  "Porta-cartão / peça de mesa",
  "Lembrancinha de evento",
  "Outra coisa (conto no campo abaixo)",
];

const PRAZOS = [
  "Ainda não tenho data",
  "Até 15 dias",
  "Até 30 dias",
  "Tenho data marcada (digo abaixo)",
];

const ACEITOS = ".png,.jpg,.jpeg,.pdf,.svg,.ai,.eps,.cdr,.dxf,.stl,.3mf,.step,.zip";
const MAX_MB = 50;

export default function BrindeForm() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [avisado, setAvisado] = useState(false);
  const [enviando, setEnviando] = useState("");
  const [erro, setErro] = useState("");
  // Agrupa os anexos deste envio numa pasta só, para a arte não ficar solta no
  // balde sem nada dizendo de qual pedido ela é.
  const pasta = useRef(Math.random().toString(36).slice(2, 12));
  // Campo invisível: robô preenche tudo que encontra, gente preenche o que vê.
  const [isca, setIsca] = useState("");

  const [form, setForm] = useState({
    empresa: "",
    documento: "",
    nome: "",
    email: "",
    telefone: "",
    quantidade: String(site.brindes.minimo),
    descricao: "",
  });
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [prazo, setPrazo] = useState(PRAZOS[0]);

  const muda = (campo: keyof typeof form, valor: string) =>
    setForm((antes) => ({ ...antes, [campo]: valor }));

  // CNPJ é opcional aqui — muita empresa pequena manda o pedido antes de
  // passar para o financeiro. Mas se veio preenchido e está errado, é erro de
  // digitação, e avisar agora evita a nota sair no documento errado depois.
  const documentoOk = documentoValido(form.documento);
  const digitos = form.documento.replace(/\D/g, "").length;
  const documentoErrado =
    Boolean(form.documento) && !documentoOk && (digitos === 11 || digitos === 14);

  const abaixoDoMinimo =
    Number(form.quantidade) > 0 && Number(form.quantidade) < site.brindes.minimo;

  const adiciona = (lista: FileList | null) => {
    if (!lista) return;
    const chegando = Array.from(lista);

    const grandes = chegando.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (grandes.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: `O limite é ${MAX_MB} MB por arquivo.`,
        variant: "error",
      });
    }

    const aceitos = chegando.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (aceitos.length > 0) {
      setArquivos((antes) => [...antes, ...aceitos].slice(0, 5));
      toast({
        title: `${aceitos.length} ${aceitos.length === 1 ? "arquivo anexado" : "arquivos anexados"}`,
      });
    }
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (enviando) return;

    setErro("");

    try {
      const anexos: Anexo[] = [];
      for (let i = 0; i < arquivos.length; i += 1) {
        setEnviando(`Enviando arquivo ${i + 1} de ${arquivos.length}...`);
        // Um de cada vez: arte de empresa costuma ser pesada, e mandar tudo
        // junto numa conexão de celular derruba todos em vez de nenhum.
        anexos.push(await sobeArquivo(arquivos[i], pasta.current));
      }

      setEnviando("Registrando seu pedido...");

      const r = await fetch("/api/orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origem: "brindes",
          empresa: form.empresa,
          documento: form.documento,
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          quantidade: form.quantidade,
          // O tipo de brinde ocupa o lugar do material, e o prazo o dele
          // mesmo: é o que a aba Orçamentos do Precifica já mostra em coluna.
          material: tipo,
          prazo,
          descricao: form.descricao,
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
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      // Falhou de verdade, e a tela diz isso. Um "recebemos seu pedido" sem ter
      // recebido é o pior defeito que um formulário pode ter.
      const recado = e instanceof Error ? e.message : "Não consegui enviar.";
      setErro(recado);
      toast({ title: "Não consegui enviar", description: recado, variant: "error" });
    } finally {
      setEnviando("");
    }
  };

  if (enviado) {
    return (
      <div className="glass border-glow rounded-3xl p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-400">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-white">
          Recebemos seu pedido
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-silver-400">
          A solicitação é a{" "}
          <strong className="text-white tabular-nums">{protocolo}</strong>.
          Respondemos em até 24 horas úteis com preço por peça, prazo e uma
          prévia de como a marca fica na peça
          {avisado ? (
            <>
              {" "}
              — no e-mail <strong className="text-white">{form.email}</strong>
            </>
          ) : (
            <>
              {" "}
              — no WhatsApp{" "}
              <strong className="text-white">{form.telefone}</strong>
            </>
          )}
          .
        </p>

        <AvisoDeEmail oQue="a confirmação" />

        <a
          href={whatsappLink(
            `Olá! Sou da ${form.empresa || "empresa"} e acabei de enviar o pedido de brindes ${protocolo} pelo site.`,
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
    <form onSubmit={enviar} className="glass border-glow rounded-3xl p-7 sm:p-9">
      {/* A empresa */}
      <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
        A empresa
      </p>
      <div className="mt-5 space-y-6">
        <Field
          label="Nome da empresa"
          value={form.empresa}
          onChange={(v) => muda("empresa", v)}
          placeholder="Como ela aparece para o cliente"
          required
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="CNPJ"
            value={form.documento}
            onChange={(v) => muda("documento", formataDocumento(v))}
            placeholder="00.000.000/0000-00"
            hint={
              documentoErrado
                ? "Confira esse CNPJ — os dígitos não fecham."
                : "Opcional. Serve para a proposta já sair no nome certo."
            }
          />
          <Field
            label="Quem fala com a gente"
            value={form.nome}
            onChange={(v) => muda("nome", v)}
            placeholder="Seu nome"
            required
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => muda("email", v)}
            placeholder="voce@empresa.com.br"
            required
          />
          <Field
            label="WhatsApp"
            type="tel"
            value={form.telefone}
            onChange={(v) => muda("telefone", v)}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </div>

      {/* O pedido */}
      <div className="mt-9 space-y-6 border-t border-white/8 pt-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
          O pedido
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <Select label="O que você precisa" value={tipo} options={TIPOS} onChange={setTipo} />
          <Field
            label="Quantas peças"
            type="number"
            value={form.quantidade}
            onChange={(v) => muda("quantidade", v)}
            placeholder={String(site.brindes.minimo)}
            hint={
              abaixoDoMinimo
                ? `Abaixo de ${site.brindes.minimo} peças não fecho lote, mas mande assim mesmo: às vezes dá para resolver de outro jeito.`
                : `Quanto maior o lote, menor o preço por peça. Mínimo de ${site.brindes.minimo}.`
            }
            required
          />
        </div>

        <Select label="Para quando" value={prazo} options={PRAZOS} onChange={setPrazo} />

        <Field
          label="Conte o que você imagina"
          value={form.descricao}
          onChange={(v) => muda("descricao", v)}
          placeholder="Ex.: chaveiro com o logo em relevo, dois tons, uns 5 cm. É para um evento no dia 20/11, para entregar aos clientes. As cores da marca são azul e branco."
          hint="Cores, tamanho, data do evento, se leva nome de cada pessoa — o que você já souber ajuda no preço"
          multiline
          required
        />
      </div>

      {/* A arte */}
      <div className="mt-9 border-t border-white/8 pt-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
          A arte da marca
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            adiciona(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={`mt-4 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-300 ${
            arrastando
              ? "border-cyan-400 bg-cyan-400/8"
              : "border-white/15 hover:border-cyan-400/50"
          }`}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-cyan-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
            <path d="m7 10 5-5 5 5M12 5v12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-3 text-sm text-silver-200">
            Arraste o logo aqui ou clique para escolher
          </p>
          <p className="mt-1 text-[11px] text-muted">
            PNG, PDF, SVG, AI, EPS, CDR ou modelo 3D · até {MAX_MB} MB cada
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACEITOS}
          onChange={(e) => adiciona(e.target.files)}
          aria-label="Escolher os arquivos da arte"
          className="sr-only"
        />

        {arquivos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {arquivos.map((arquivo, i) => (
              <li
                key={`${arquivo.name}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-cyan-400">
                  <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
                  <path d="M13 3v6h6" />
                </svg>
                <span className="min-w-0 flex-1 truncate text-xs text-silver-200">
                  {arquivo.name}
                </span>
                <span className="shrink-0 text-[11px] text-muted tabular-nums">
                  {(arquivo.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  type="button"
                  onClick={() => setArquivos((antes) => antes.filter((_, j) => j !== i))}
                  aria-label={`Remover ${arquivo.name}`}
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
          Não tem o arquivo em mãos? Manda uma foto do cartão de visita ou do
          site que a gente redesenha.
        </p>
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
          <a
            href={whatsappLink("Olá! Tentei mandar um pedido de brindes pelo site e deu erro.")}
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
        disabled={Boolean(enviando)}
        className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:shadow-none"
      >
        {enviando || "Pedir proposta"}
        {!enviando && (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] text-muted">
        Resposta em até 24h úteis · sua arte não é usada em nada além do seu
        pedido
      </p>
    </form>
  );
}
