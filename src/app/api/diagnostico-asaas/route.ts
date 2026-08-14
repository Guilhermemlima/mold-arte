import { NextResponse } from "next/server";

/**
 * Diagnóstico da ligação com o Asaas.
 *
 * A cobrança falhava e a única pista vivia no log do servidor. Esta rota
 * pergunta ao próprio Asaas se a chave vale, usando uma consulta que não
 * cria nem altera nada.
 *
 * Nunca devolve a chave — só o tamanho, o prefixo e se ele combina com o
 * ambiente configurado, que é justamente onde o erro costuma estar.
 *
 * Apague este arquivo quando a cobrança estiver funcionando.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const chave = process.env.ASAAS_API_KEY;
  const ambiente = process.env.ASAAS_AMBIENTE ?? "(não definido — vale sandbox)";

  if (!chave) {
    return NextResponse.json({
      chaveDefinida: false,
      ambiente,
      conclusao:
        "A variável ASAAS_API_KEY não chegou ao site. Cadastre na Vercel e " +
        "REFAÇA O DEPLOY — variável nova não entra em deploy antigo.",
    });
  }

  const limpa = chave.trim();

  // O Asaas usa prefixos diferentes por ambiente. É a checagem que pega o
  // erro mais comum: chave de um ambiente com a configuração do outro.
  const prefixo = limpa.startsWith("$aact_prod_")
    ? "produção ($aact_prod_)"
    : limpa.startsWith("aact_prod_")
      ? "produção (aact_prod_)"
      : limpa.startsWith("$aact_hmlg_") || limpa.startsWith("aact_hmlg_")
        ? "sandbox (aact_hmlg_)"
        : limpa.startsWith("$aact_") || limpa.startsWith("aact_")
          ? "desconhecido"
          : "não parece uma chave do Asaas";

  const ehProducao = prefixo.startsWith("produção");
  const ambienteProducao = process.env.ASAAS_AMBIENTE === "producao";
  const combinam = ehProducao === ambienteProducao;

  const base = ambienteProducao
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

  const info = {
    chaveDefinida: true,
    chaveTamanho: limpa.length,
    chaveTemEspacoOuQuebra: chave !== limpa,
    chavePrefixo: prefixo,
    ambiente,
    urlUsada: base,
    prefixoCombinaComAmbiente: combinam,
  };

  // Consulta que só lê: pede um cliente e nem olha o resultado.
  try {
    const r = await fetch(`${base}/customers?limit=1`, {
      headers: { access_token: limpa },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const texto = await r.text();

    let motivo: string | null = null;
    try {
      motivo = JSON.parse(texto)?.errors?.[0]?.description ?? null;
    } catch {
      /* resposta não era o formato de erro conhecido */
    }

    if (r.ok) {
      return NextResponse.json({
        ...info,
        teste: { status: r.status, ok: true },
        conclusao: "A chave funciona neste ambiente. A cobrança deveria estar sendo criada.",
      });
    }

    return NextResponse.json({
      ...info,
      teste: { status: r.status, ok: false, motivo },
      conclusao: !combinam
        ? `A chave é de ${prefixo} mas o site está apontando para ${
            ambienteProducao ? "produção" : "sandbox"
          }. Acerte ASAAS_AMBIENTE ou gere a chave no outro ambiente, e refaça o deploy.`
        : "A chave foi recusada pelo Asaas. Gere uma nova, cole sem espaços e refaça o deploy.",
    });
  } catch (e) {
    return NextResponse.json({
      ...info,
      teste: { erro: String(e).slice(0, 200) },
      conclusao: "Não consegui falar com o Asaas para testar a chave.",
    });
  }
}
