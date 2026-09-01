"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import { ATALHOS, LIMITES } from "@/lib/suporte";

/**
 * Atendimento do site.
 *
 * O botão fica na direita porque o do WhatsApp já ocupa a esquerda: são dois
 * caminhos diferentes de propósito. Aqui a pessoa resolve dúvida na hora, a
 * qualquer hora; lá ela fala com o Guilherme quando o assunto precisa de gente.
 *
 * O ponto do recurso não é o chat — é o que acontece quando ele não basta. O
 * botão de WhatsApp aparece com a conversa já resumida, e a primeira mensagem
 * que chega para o lojista diz do que se trata. Sem isso, a pessoa escreve
 * "oi" e são três trocas até descobrir o assunto.
 */

type Fala = { papel: "user" | "assistant"; texto: string };

const ABERTURA =
  "Oi! Posso ajudar com prazo, frete, pagamento, troca, peça sob medida ou " +
  "brinde para empresa. O que você precisa?";

/**
 * Respostas prontas para quando a IA não está disponível.
 *
 * Sem chave configurada, ou com a API fora do ar, o atendimento não some: vira
 * esta lista. É pior que a conversa e muito melhor que um chat mudo — e cada
 * item responde a pergunta de verdade, em vez de só empurrar para o WhatsApp.
 */
const PRONTAS: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "Quanto custa o frete?",
    resposta:
      "O frete é calculado por região, e aparece no carrinho assim que você " +
      "informa o CEP. Acima de um valor por região ele fica grátis — o carrinho " +
      "mostra quanto falta.",
  },
  {
    pergunta: "Qual o prazo de entrega?",
    resposta:
      "Cada peça é impressa sob demanda depois do pagamento. O prazo de produção " +
      "aparece na página da peça, e o de envio depende do seu estado. Quando o " +
      "pedido é despachado, o código de rastreio chega no seu e-mail.",
  },
  {
    pergunta: "Como acompanho meu pedido?",
    resposta:
      "Em /pedido, com o número do pedido e o e-mail usado na compra. Não " +
      "precisa criar conta.",
  },
  {
    pergunta: "Posso trocar ou devolver?",
    resposta:
      "Pode: 7 dias corridos depois de receber, sem precisar justificar. Peça " +
      "com defeito a gente refaz ou devolve o valor. Peça feita sob medida não " +
      "tem direito de arrependimento, mas defeito continua coberto. Detalhes em /trocas.",
  },
  {
    pergunta: "Quero uma peça personalizada",
    resposta:
      "Manda pelo formulário em /orcamento — aceita arquivo 3D, foto, desenho " +
      "ou só a medida. A resposta com preço e prazo sai em até 24 horas úteis.",
  },
  {
    pergunta: "Brindes para empresa",
    resposta:
      "Chaveiro, ímã, troféu e lembrancinha com a marca da empresa, a partir de " +
      `${site.brindes.minimo} peças. A página /brindes tem o formulário e explica como funciona.`,
  },
];

export default function Suporte() {
  const [aberto, setAberto] = useState(false);
  const [conversa, setConversa] = useState<Fala[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [semIa, setSemIa] = useState(false);
  const [recado, setRecado] = useState("");
  const [levandoParaOZap, setLevandoParaOZap] = useState(false);

  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  // Rola para a última fala a cada mudança — sem isso a resposta nasce fora da
  // área visível e parece que nada aconteceu.
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [conversa, pensando]);

  useEffect(() => {
    if (aberto) campo.current?.focus();
  }, [aberto]);

  // Esc fecha, como em qualquer painel.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const acabou = conversa.length >= LIMITES.porConversa;

  const pergunta = async (bruto: string) => {
    const escrito = bruto.trim().slice(0, LIMITES.porMensagem);
    if (!escrito || pensando || acabou) return;

    const nova: Fala[] = [...conversa, { papel: "user", texto: escrito }];
    setConversa(nova);
    setTexto("");
    setRecado("");
    setPensando(true);

    try {
      const r = await fetch("/api/suporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversa: nova }),
      });
      const dados = await r.json();

      if (dados.ok && dados.texto) {
        setConversa([...nova, { papel: "assistant", texto: dados.texto }]);
      } else if (dados.motivo === "sem_chave") {
        setSemIa(true);
      } else if (dados.motivo === "ocupado") {
        // Cota respirando: a pergunta volta a valer em segundos, então o texto
        // convida a repetir em vez de mandar a pessoa embora.
        setRecado(dados.recado);
      } else {
        setRecado(dados.recado ?? "Não consegui responder agora.");
      }
    } catch {
      setRecado("Sem conexão com o atendimento. Confira sua internet.");
    } finally {
      setPensando(false);
    }
  };

  /**
   * Leva a conversa para o WhatsApp já resumida.
   *
   * Se o resumo falhar, o WhatsApp abre do mesmo jeito com a última pergunta —
   * perder o contato porque o resumo não saiu seria trocar o essencial pelo
   * acessório.
   */
  const paraOWhatsapp = async () => {
    if (levandoParaOZap) return;
    setLevandoParaOZap(true);

    const ultima = [...conversa].reverse().find((m) => m.papel === "user")?.texto ?? "";
    let mensagem = ultima
      ? `Olá! Vim pelo chat do site. Minha dúvida: ${ultima}`
      : "Olá! Vim pelo chat do site.";

    try {
      if (conversa.length > 1 && !semIa) {
        const r = await fetch("/api/suporte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversa, acao: "resumo" }),
        });
        const dados = await r.json();
        if (dados.ok && dados.resumo) {
          mensagem = `Olá! Vim pelo chat do site.\n\n${dados.resumo}`;
        }
      }
    } catch {
      /* fica com a mensagem simples */
    } finally {
      setLevandoParaOZap(false);
    }

    window.open(whatsappLink(mensagem), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Botão */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar o atendimento" : "Abrir o atendimento"}
        className={cx(
          "fixed bottom-5 right-5 z-[80] flex h-13 w-13 items-center justify-center rounded-full border border-cyan-400/40 bg-navy-900 text-cyan-400 shadow-[0_10px_30px_-8px_rgba(56,216,245,0.5)] transition-transform duration-300 hover:scale-110 sm:bottom-6 sm:right-6",
        )}
        style={{ width: 52, height: 52 }}
      >
        {aberto ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
            <path d="M9 11h6M9 15h4" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Painel */}
      <div
        role="dialog"
        aria-label="Atendimento"
        aria-hidden={!aberto}
        // Fechado, o painel continua no DOM para poder animar — e sem isto os
        // sete botões dele continuariam alcançáveis pelo Tab, com a pessoa
        // navegando às cegas por um painel invisível.
        inert={!aberto}
        className={cx(
          "glass fixed bottom-24 right-4 z-[80] flex max-h-[70vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/12 transition-all duration-300 sm:right-6 sm:w-[380px]",
          aberto
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <header className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400" aria-hidden />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white">Atendimento</p>
            <p className="text-[11px] text-muted">
              {semIa ? "respostas rápidas" : "respondo na hora, sobre a loja"}
            </p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {semIa ? (
            <>
              <p className="text-xs leading-relaxed text-silver-400">{ABERTURA}</p>
              <div className="space-y-2 pt-1">
                {PRONTAS.map((item) => (
                  <details
                    key={item.pergunta}
                    className="rounded-xl border border-white/10 bg-white/4 px-4 py-3"
                  >
                    <summary className="cursor-pointer text-xs font-semibold text-white">
                      {item.pergunta}
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-silver-400">
                      {item.resposta}
                    </p>
                  </details>
                ))}
              </div>
            </>
          ) : (
            <>
              <Balao papel="assistant" texto={ABERTURA} />
              {conversa.map((fala, i) => (
                <Balao key={i} papel={fala.papel} texto={fala.texto} />
              ))}
              {pensando && (
                <p className="text-xs text-muted" aria-live="polite">
                  escrevendo…
                </p>
              )}
              {conversa.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {ATALHOS.map((atalho) => (
                    <button
                      key={atalho}
                      type="button"
                      onClick={() => pergunta(atalho)}
                      className="rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-silver-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-300"
                    >
                      {atalho}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {recado && (
            <p role="alert" className="text-xs leading-relaxed text-amber-300">
              {recado}
            </p>
          )}
          {acabou && !semIa && (
            <p className="text-xs leading-relaxed text-amber-300">
              A conversa ficou longa. Daqui em diante o WhatsApp resolve melhor.
            </p>
          )}
          <div ref={fim} />
        </div>

        <footer className="border-t border-white/8 px-4 py-3">
          {!semIa && !acabou && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                pergunta(texto);
              }}
              className="flex gap-2"
            >
              <input
                ref={campo}
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, LIMITES.porMensagem))}
                placeholder="Escreva sua dúvida"
                aria-label="Sua dúvida"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-cyan-400/60"
              />
              <button
                type="submit"
                disabled={pensando || !texto.trim()}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink transition-colors hover:bg-cyan-300 disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={paraOWhatsapp}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 px-4 py-2.5 text-xs font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/10"
          >
            {levandoParaOZap ? "Preparando o resumo…" : `Falar com uma pessoa no WhatsApp`}
          </button>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-muted">
            Respostas automáticas sobre a loja. Não peça nem informe dados de
            cartão ou senha por aqui.
          </p>
        </footer>
      </div>
    </>
  );
}

function Balao({ papel, texto }: Fala) {
  const meu = papel === "user";
  return (
    <div className={cx("flex", meu ? "justify-end" : "justify-start")}>
      <p
        className={cx(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
          meu
            ? "bg-cyan-400/15 text-white"
            : "border border-white/10 bg-white/4 text-silver-200",
        )}
      >
        {texto}
      </p>
    </div>
  );
}
