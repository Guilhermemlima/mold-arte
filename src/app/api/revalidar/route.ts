import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Aviso de que o catálogo mudou.
 *
 * Sem isto, o site guarda a lista de produtos por um tempo antes de perguntar
 * de novo ao banco — e você fica esperando esse prazo vencer depois de
 * publicar. A espera existe para não gerar uma consulta ao banco a cada
 * visitante.
 *
 * Aqui a lógica se inverte: o Precifica avisa quando algo muda, o site joga
 * fora o que tinha guardado, e a próxima visita já vê o valor novo. O prazo
 * automático continua de pé como rede de segurança, para o caso de o aviso
 * não chegar.
 *
 * A chave impede que qualquer um force isso o dia inteiro só para fazer o
 * site martelar o banco.
 */

export const dynamic = "force-dynamic";

const segredo = process.env.REVALIDATE_SECRET;

// O Precifica roda em outro endereço — no computador, no celular, às vezes
// como arquivo local. Liberar a origem é seguro aqui porque quem protege esta
// rota é a chave, não de onde a chamada veio.
const cabecalhosCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cabecalhosCors });
}

function responde(requisicao: Request, chaveRecebida: string | null) {
  if (!segredo) {
    return NextResponse.json(
      {
        ok: false,
        recado:
          "A loja não tem REVALIDATE_SECRET configurado. Enquanto isso ela " +
          "continua atualizando sozinha pelo prazo automático.",
      },
      { status: 503, headers: cabecalhosCors },
    );
  }

  if (chaveRecebida !== segredo) {
    return NextResponse.json(
      { ok: false, recado: "chave inválida" },
      { status: 401, headers: cabecalhosCors },
    );
  }

  // As três telas que mostram produto. A de produto é um molde: revalidar o
  // molde alcança todas as peças de uma vez, sem precisar listar uma a uma.
  revalidatePath("/");
  revalidatePath("/loja");
  revalidatePath("/produto/[slug]", "page");

  return NextResponse.json(
    { ok: true, em: new Date().toISOString() },
    { headers: cabecalhosCors },
  );
}

export async function POST(requisicao: Request) {
  let chave: string | null = null;
  try {
    const corpo = await requisicao.json();
    chave = corpo?.chave ?? null;
  } catch {
    chave = null;
  }
  if (!chave) chave = new URL(requisicao.url).searchParams.get("chave");
  return responde(requisicao, chave);
}

// Também por GET, para você conseguir testar colando no navegador.
export async function GET(requisicao: Request) {
  const chave = new URL(requisicao.url).searchParams.get("chave");
  return responde(requisicao, chave);
}
