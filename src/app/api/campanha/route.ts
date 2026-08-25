import { NextResponse } from "next/server";
import { cabecalhosCors, comCors } from "@/lib/cors";
import { bancoConfigurado, chaveServico, dono, insere, supabaseUrl } from "@/lib/admin";
import { convidaComCupom } from "@/lib/email";
import { siteUrl } from "@/lib/site";

/**
 * Convite com cupom para a lista.
 *
 * Disparado por você, na aba Clientes do Precifica. Serve para o caso de quem
 * se cadastrou, deu uma olhada e nunca comprou: um desconto no nome da pessoa,
 * com o texto que você escreveu.
 *
 * **Um cupom por pessoa, não um código para todos.** Um código único mandado
 * para a lista inteira vira desconto público assim que alguém colar num grupo
 * — e aí ele deixa de ser um convite e vira o preço novo da loja. Aqui cada
 * pessoa recebe o seu, preso ao e-mail dela e de uso único.
 *
 * Protegida pelo mesmo segredo do cron.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Permissão para o Precifica chamar daqui de fora (ele roda noutro endereço). */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cabecalhosCors });
}

export async function POST(requisicao: Request) {
  return comCors(await responde(requisicao));
}

const segredo = process.env.CRON_SECRET;

/**
 * Quantos por chamada.
 *
 * Cada pessoa custa duas idas ao banco e um e-mail. Sessenta cabem com folga
 * no minuto que a hospedagem dá; passar disso faria a função morrer no meio,
 * com parte da lista avisada e nenhuma resposta dizendo quem.
 */
const POR_VEZ = 60;

type Pessoa = {
  email: string;
  nome: string;
  pedidos: number;
  novidades: boolean;
  cupons_ativos: number;
};

function cabecalhos(extras: Record<string, string> = {}) {
  return {
    apikey: chaveServico as string,
    Authorization: `Bearer ${chaveServico}`,
    "Content-Type": "application/json",
    ...extras,
  };
}

/** Código curto, sorteado, sem as letras que se confundem com números. */
function novoCodigo(prefixo: string) {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i += 1) {
    s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return `${prefixo}${s}`;
}

function oQueOCupomFaz(tipo: string, valor: number) {
  if (tipo === "frete") return "frete grátis";
  if (tipo === "percentual") return `${valor.toFixed(0)}% de desconto`;
  return `${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de desconto`;
}

async function responde(requisicao: Request) {
  if (!segredo) {
    return NextResponse.json(
      { ok: false, recado: "Falta a variável CRON_SECRET na Vercel." },
      { status: 503 },
    );
  }
  if (requisicao.headers.get("x-cron-secret") !== segredo) {
    return NextResponse.json({ ok: false, recado: "segredo inválido" }, { status: 401 });
  }
  if (!bancoConfigurado) {
    return NextResponse.json({ ok: false, recado: "banco não configurado" }, { status: 503 });
  }

  let corpo: {
    mensagem?: unknown;
    tipo?: unknown;
    valor?: unknown;
    dias?: unknown;
    minimo?: unknown;
    /** "interessados" (padrão) manda só para quem nunca comprou. */
    alvo?: unknown;
    /** Só conta quantos receberiam, sem criar nem enviar nada. */
    simular?: unknown;
  };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const tipo = ["percentual", "valor", "frete"].includes(String(corpo.tipo))
    ? String(corpo.tipo)
    : "percentual";
  const valor = tipo === "frete" ? 0 : Number(corpo.valor) || 0;
  const dias = Math.max(1, Math.min(365, Number(corpo.dias) || 30));
  const minimo = Math.max(0, Number(corpo.minimo) || 0);
  const soInteressados = String(corpo.alvo ?? "interessados") !== "todos";
  const mensagem = String(corpo.mensagem ?? "").trim().slice(0, 3000);

  if (tipo !== "frete" && !(valor > 0)) {
    return NextResponse.json(
      { ok: false, recado: "Diga quanto o cupom desconta." },
      { status: 400 },
    );
  }
  if (tipo === "percentual" && valor > 90) {
    return NextResponse.json(
      { ok: false, recado: "Percentual acima de 90% não é aceito." },
      { status: 400 },
    );
  }
  if (!corpo.simular && mensagem.length < 20) {
    return NextResponse.json(
      { ok: false, recado: "Escreva a mensagem — ela é o convite." },
      { status: 400 },
    );
  }

  try {
    // Quem é quem sai da mesma função que a aba Clientes usa, para os dois
    // lados contarem a mesma coisa.
    const rPessoas = await fetch(`${supabaseUrl}/rest/v1/rpc/clientes_loja`, {
      method: "POST",
      headers: cabecalhos(),
      cache: "no-store",
      body: JSON.stringify({ p_usuario: dono }),
    });

    if (!rPessoas.ok) {
      const texto = await rPessoas.text();
      console.error(`[campanha] clientes_loja respondeu ${rPessoas.status}: ${texto}`);
      return NextResponse.json(
        {
          ok: false,
          recado:
            rPessoas.status === 404
              ? "O banco ainda não tem a lista de clientes. Rode o supabase-clientes.sql."
              : "Não consegui ler a lista.",
        },
        { status: 502 },
      );
    }

    const pessoas = (await rPessoas.json()) as Pessoa[];

    // A chave da saída da lista mora na tabela de mensagens. Sem ela o e-mail
    // não teria como oferecer o descadastro — e e-mail de oferta sem saída
    // vira denúncia de spam, que estraga a entrega dos e-mails de pedido.
    const rChaves = await fetch(
      `${supabaseUrl}/rest/v1/mensagens_loja?select=email,chave` +
        `&tipo=eq.novidades&saiu_em=is.null&email=not.is.null`,
      { headers: cabecalhos(), cache: "no-store" },
    );
    const chaves = new Map<string, string>();
    if (rChaves.ok) {
      const linhas = (await rChaves.json()) as { email: string; chave: string }[];
      linhas.forEach((x) => {
        if (x.email && x.chave) chaves.set(x.email.trim().toLowerCase(), x.chave);
      });
    }

    const alvos = pessoas.filter((p) => {
      if (!p.novidades) return false;                    // só quem pediu para receber
      if (soInteressados && (p.pedidos ?? 0) > 0) return false;
      // Quem já tem cupom valendo fica de fora: mandar outro seria empilhar
      // desconto e ensinar a esperar o próximo.
      if ((p.cupons_ativos ?? 0) > 0) return false;
      return chaves.has(p.email);
    });

    const lote = alvos.slice(0, POR_VEZ);
    const deFora = Math.max(0, alvos.length - lote.length);

    if (corpo.simular) {
      return NextResponse.json({
        ok: true,
        simulado: true,
        quantos: lote.length,
        naLista: alvos.length,
        deFora,
      });
    }

    const vence = new Date();
    vence.setDate(vence.getDate() + dias);
    const validoAte = vence.toISOString().slice(0, 10);
    const oQueFaz = oQueOCupomFaz(tipo, valor);
    const prefixo = tipo === "frete" ? "FRETE" : "OLHA";

    let enviados = 0;
    const falhas: string[] = [];

    for (const pessoa of lote) {
      // Duas tentativas de código: ele é sorteado, e dois sorteios iguais
      // bateriam na chave primária. Raro, mas falhar por azar seria bobo.
      let codigo = "";
      let criado: Awaited<ReturnType<typeof insere>> | null = null;

      for (let tentativa = 0; tentativa < 2; tentativa += 1) {
        codigo = novoCodigo(prefixo);
        criado = await insere("cupons", {
          usuario: dono,
          codigo,
          tipo,
          valor,
          minimo,
          ativo: true,
          expira_em: validoAte,
          usos_max: 1,
          email: pessoa.email,
          descricao: `Convite para quem ainda não comprou (${validoAte})`,
        });
        if (criado.ok || !criado.erro.includes("duplicate key")) break;
      }

      if (!criado || !criado.ok) {
        console.error(`[campanha] cupom de ${pessoa.email} não saiu: ${criado?.erro}`);
        falhas.push(pessoa.email);
        continue;
      }

      // O e-mail só vai depois de o cupom existir: anunciar um código que não
      // está no banco faria a pessoa digitar e ouvir "cupom não encontrado".
      const foi = await convidaComCupom({
        email: pessoa.email,
        nome: pessoa.nome || null,
        mensagem,
        codigo,
        oQueFaz,
        validoAte: vence.toLocaleDateString("pt-BR"),
        minimo,
        linkSaida: `${siteUrl}/api/sair?c=${encodeURIComponent(chaves.get(pessoa.email) as string)}`,
      }).catch(() => false);

      if (foi) enviados += 1;
      else falhas.push(pessoa.email);
    }

    console.log(
      `[campanha] ${enviados} de ${lote.length} enviados` +
        (deFora ? ` — ${deFora} ficaram para a próxima chamada.` : "."),
    );

    return NextResponse.json({
      ok: true,
      enviados,
      quantos: lote.length,
      naLista: alvos.length,
      deFora,
      // Cupom criado e e-mail não enviado: o código existe e você pode passar
      // pelo WhatsApp. Melhor saber quem do que descobrir depois.
      falhas,
    });
  } catch (e) {
    console.error("[campanha] falhou:", e);
    return NextResponse.json(
      { ok: false, recado: "Não consegui enviar agora." },
      { status: 502 },
    );
  }
}
