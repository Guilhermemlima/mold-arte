import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { bancoConfigurado, dono, insere } from "@/lib/admin";
import { comoAtender, fatosDaLoja, LIMITES } from "@/lib/suporte";

/**
 * Atendimento do site.
 *
 * Responde a dúvida na hora e, quando o assunto precisa de gente, entrega a
 * conversa mastigada: um resumo de duas linhas que vira a primeira mensagem do
 * WhatsApp. Hoje a pessoa escreve "oi" e você gasta três trocas até descobrir
 * do que se trata.
 *
 * Três coisas que valem a leitura:
 *
 * O que o atendimento pode afirmar vem de `lib/suporte.ts`, que lê o mesmo
 * `site.ts` da loja. Frete, prazo e mínimo de brindes nunca são digitados no
 * prompt — se fossem, envelheceriam calados e o chat prometeria o preço do ano
 * passado.
 *
 * A conversa fica gravada em `mensagens_loja` com tipo `suporte`. Não é para
 * espionar ninguém: é para você ler o que as pessoas perguntam e descobrir o
 * que falta explicar no site.
 *
 * E tudo aqui tem teto: tamanho de mensagem, número de trocas e chamadas por
 * navegador. Chat de IA aberto na internet sem limite é uma conta de API que
 * qualquer pessoa mal-intencionada pode encher sozinha.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const chave = process.env.ANTHROPIC_API_KEY;

/**
 * O modelo. Trocar aqui muda o atendimento inteiro.
 *
 * Uma conversa típica custa alguns centavos. Se um dia o volume crescer a
 * ponto de a conta incomodar, dá para trocar por um modelo mais barato — mas é
 * decisão sua, não minha, e a diferença aparece na qualidade da resposta.
 */
const MODELO = "claude-opus-5";

/**
 * Teto por navegador, por hora.
 *
 * Vive na memória da função, então some quando a hospedagem recicla o processo
 * e não é compartilhado entre regiões. É um redutor de estrago, não um cadeado:
 * segura o exagero comum sem exigir banco no caminho da resposta.
 */
const TETO_POR_HORA = 40;
const visitas = new Map<string, { desde: number; usos: number }>();

function passouDoTeto(quem: string) {
  const agora = Date.now();
  const registro = visitas.get(quem);

  if (!registro || agora - registro.desde > 3600_000) {
    visitas.set(quem, { desde: agora, usos: 1 });
    // Limpeza preguiçosa: sem isto o mapa cresce até a função morrer.
    if (visitas.size > 5000) {
      for (const [ip, r] of visitas) {
        if (agora - r.desde > 3600_000) visitas.delete(ip);
      }
    }
    return false;
  }

  registro.usos += 1;
  return registro.usos > TETO_POR_HORA;
}

type Fala = { papel: "user" | "assistant"; texto: string };

function limpaConversa(bruto: unknown): Fala[] {
  if (!Array.isArray(bruto)) return [];
  return bruto
    .slice(-LIMITES.porConversa)
    .map((m: { papel?: unknown; texto?: unknown }) => ({
      papel: m?.papel === "assistant" ? ("assistant" as const) : ("user" as const),
      texto: String(m?.texto ?? "").trim().slice(0, LIMITES.porMensagem),
    }))
    .filter((m) => m.texto);
}

/** Guarda a conversa para você ler depois. Nunca derruba a resposta. */
async function guarda(conversa: Fala[], assunto: string) {
  if (!bancoConfigurado) return;
  try {
    await insere("mensagens_loja", {
      usuario: dono,
      tipo: "suporte",
      nome: "Chat do site",
      assunto: assunto.slice(0, 160),
      mensagem: conversa
        .map((m) => `${m.papel === "user" ? "Cliente" : "Atendimento"}: ${m.texto}`)
        .join("\n\n")
        .slice(0, 8000),
    });
  } catch (e) {
    console.error("[suporte] não gravei a conversa:", e);
  }
}

export async function POST(requisicao: Request) {
  if (!chave) {
    // Sem chave o site não fica sem atendimento: a tela cai no modo lista, com
    // as respostas prontas e o WhatsApp. Por isso 200, e não erro.
    return NextResponse.json({ ok: false, motivo: "sem_chave" });
  }

  const quem =
    requisicao.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requisicao.headers.get("x-real-ip") ||
    "desconhecido";

  if (passouDoTeto(quem)) {
    return NextResponse.json({
      ok: false,
      motivo: "muitas_perguntas",
      recado:
        "Conversamos bastante por aqui. Para seguir agora, chama no WhatsApp — " +
        "lá tem gente de verdade do outro lado.",
    });
  }

  let corpo: { conversa?: unknown; acao?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const conversa = limpaConversa(corpo.conversa);
  if (!conversa.length) {
    return NextResponse.json({ ok: false, recado: "Escreva sua dúvida." }, { status: 400 });
  }

  const cliente = new Anthropic({ apiKey: chave });

  // As falas viram mensagens da API sem tradução nenhuma de conteúdo: o que a
  // pessoa escreveu é dado, não instrução, e o papel dela é sempre "user".
  const mensagens: Anthropic.MessageParam[] = conversa.map((m) => ({
    role: m.papel,
    content: m.texto,
  }));

  try {
    if (corpo.acao === "resumo") {
      // Resumo para o WhatsApp. É o pedaço que economiza o seu tempo: em vez de
      // "oi", chega o assunto já escrito.
      const resposta = await cliente.messages.create({
        model: MODELO,
        max_tokens: 400,
        output_config: { effort: "low" },
        system:
          "Resuma a conversa abaixo em português do Brasil, para o dono da loja " +
          "ler no WhatsApp antes de responder. Escreva no máximo duas frases, na " +
          "terceira pessoa, dizendo o que a pessoa quer e o que já foi respondido. " +
          "Sem saudação, sem despedida, sem repetir o texto inteiro. Se a pessoa " +
          "informou número de pedido, inclua.",
        messages: [
          {
            role: "user",
            content: conversa
              .map((m) => `${m.papel === "user" ? "Cliente" : "Atendimento"}: ${m.texto}`)
              .join("\n"),
          },
        ],
      });

      const resumo = resposta.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();

      await guarda(conversa, resumo || "Conversa no chat do site");

      return NextResponse.json({ ok: true, resumo });
    }

    const resposta = await cliente.messages.create({
      model: MODELO,
      max_tokens: 700,
      // Dúvida de loja não pede raciocínio longo, e esforço menor responde mais
      // rápido — num chat, demora é a diferença entre esperar e fechar a aba.
      output_config: { effort: "low" },
      system: [
        {
          type: "text",
          text: `${comoAtender()}\n\n=== FATOS DA LOJA ===\n${fatosDaLoja()}`,
          // O texto é o mesmo em toda conversa: cacheado, as próximas trocas
          // custam uma fração e voltam mais rápido.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: mensagens,
    });

    if (resposta.stop_reason === "refusal") {
      return NextResponse.json({
        ok: true,
        texto:
          "Esse assunto eu não consigo tratar por aqui. Se for sobre um pedido " +
          "ou uma peça, me conta de outro jeito — ou chama no WhatsApp.",
      });
    }

    const texto = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!texto) {
      return NextResponse.json({
        ok: true,
        texto: "Não consegui formular a resposta. Chama no WhatsApp que eu te ajudo por lá.",
      });
    }

    return NextResponse.json({ ok: true, texto });
  } catch (e) {
    // Erro de chave, de cota ou de rede: a pessoa não pode ficar olhando para
    // um chat mudo. A tela mostra o caminho do WhatsApp.
    if (e instanceof Anthropic.AuthenticationError) {
      console.error("[suporte] ANTHROPIC_API_KEY recusada pela API.");
    } else if (e instanceof Anthropic.RateLimitError) {
      console.error("[suporte] limite da API atingido.");
    } else {
      console.error("[suporte] falhou:", e);
    }

    return NextResponse.json({
      ok: false,
      motivo: "erro",
      recado:
        "O atendimento automático travou aqui. Chama no WhatsApp que a gente resolve.",
    });
  }
}
