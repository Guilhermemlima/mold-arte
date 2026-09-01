import { NextResponse } from "next/server";
import { bancoConfigurado, dono, insere } from "@/lib/admin";
import { comoAtender, fatosDaLoja, LIMITES } from "@/lib/suporte";

/**
 * Atendimento do site.
 *
 * Responde a dúvida na hora e, quando o assunto precisa de gente, entrega a
 * conversa mastigada: um resumo de duas linhas que vira a primeira mensagem do
 * WhatsApp. Hoje a pessoa escreve "oi" e são três trocas até você descobrir do
 * que se trata.
 *
 * Roda na Groq (console.groq.com), na camada gratuita: sem cartão, sem cobrança
 * por token, limitada por taxa de uso — folga grande para o volume da loja. O
 * contrato deles diz, explicitamente, que não treinam modelo com o que passa
 * pela API, o que importa aqui porque a conversa carrega número de pedido, nome
 * e às vezes reclamação.
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
 * navegador. Chat aberto na internet sem limite é cota de graça que qualquer
 * pessoa mal-intencionada esgota sozinha numa madrugada.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const chave = process.env.GROQ_API_KEY;

const ENDERECO = "https://api.groq.com/openai/v1/chat/completions";

/**
 * O modelo. Trocar aqui muda o atendimento inteiro.
 *
 * Llama 3.3 70B é o mais equilibrado da camada gratuita para conversa em
 * português. Se um dia ele escorregar em seguir regra, `openai/gpt-oss-120b`
 * é o outro candidato — mesma camada, mesma chamada, só o nome muda.
 */
const MODELO = "llama-3.3-70b-versatile";

/**
 * Temperatura baixa de propósito.
 *
 * Atendimento não é lugar de criatividade: o valor certo do frete escrito de
 * um jeito sem graça vale mais que uma resposta simpática com o número errado.
 */
const TEMPERATURA = 0.3;

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
type MensagemDaApi = { role: "system" | "user" | "assistant"; content: string };

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

function transcricao(conversa: Fala[]) {
  return conversa
    .map((m) => `${m.papel === "user" ? "Cliente" : "Atendimento"}: ${m.texto}`)
    .join("\n");
}

/**
 * A chamada.
 *
 * Sem biblioteca: a Groq fala o mesmo formato da OpenAI, e é uma requisição
 * HTTP só — do mesmo jeito que este projeto já conversa com o Asaas, o Resend e
 * o Supabase. Uma dependência a menos para manter e para atualizar.
 */
async function pergunta(mensagens: MensagemDaApi[], limite: number) {
  const r = await fetch(ENDERECO, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      model: MODELO,
      messages: mensagens,
      max_tokens: limite,
      temperature: TEMPERATURA,
    }),
    // Quem está do outro lado é uma pessoa esperando com o chat aberto.
    // Melhor cair no recado do WhatsApp do que deixar rodando sem fim.
    signal: AbortSignal.timeout(25_000),
  });

  if (!r.ok) {
    const detalhe = (await r.text()).slice(0, 300);
    throw new Error(`groq ${r.status}: ${detalhe}`);
  }

  const dados = (await r.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return (dados.choices?.[0]?.message?.content ?? "").trim();
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
      mensagem: transcricao(conversa).slice(0, 8000),
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

  try {
    if (corpo.acao === "resumo") {
      // Resumo para o WhatsApp. É o pedaço que economiza o seu tempo: em vez de
      // "oi", chega o assunto já escrito.
      const resumo = await pergunta(
        [
          {
            role: "system",
            content:
              "Resuma a conversa em português do Brasil, para o dono da loja ler " +
              "no WhatsApp antes de responder. No máximo duas frases, na terceira " +
              "pessoa, dizendo o que a pessoa quer e o que já foi respondido. Sem " +
              "saudação, sem despedida, sem repetir a conversa inteira. Se houver " +
              "número de pedido, inclua. Responda só o resumo.",
          },
          { role: "user", content: transcricao(conversa) },
        ],
        250,
      );

      await guarda(conversa, resumo || "Conversa no chat do site");

      return NextResponse.json({ ok: true, resumo });
    }

    // O que a pessoa escreveu entra como mensagem dela, nunca como instrução:
    // as regras vivem no papel de sistema, acima, e é lá que elas mandam.
    const texto = await pergunta(
      [
        {
          role: "system",
          content: `${comoAtender()}\n\n=== FATOS DA LOJA ===\n${fatosDaLoja()}`,
        },
        ...conversa.map((m) => ({ role: m.papel, content: m.texto })),
      ],
      600,
    );

    if (!texto) {
      return NextResponse.json({
        ok: true,
        texto: "Não consegui formular a resposta. Chama no WhatsApp que eu te ajudo por lá.",
      });
    }

    return NextResponse.json({ ok: true, texto });
  } catch (e) {
    // Chave errada, cota do dia esgotada ou rede fora: a pessoa não pode ficar
    // olhando para um chat mudo. A tela mostra o caminho do WhatsApp.
    console.error("[suporte] falhou:", e instanceof Error ? e.message : e);

    return NextResponse.json({
      ok: false,
      motivo: "erro",
      recado:
        "O atendimento automático travou aqui. Chama no WhatsApp que a gente resolve.",
    });
  }
}
