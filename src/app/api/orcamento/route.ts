import { NextResponse } from "next/server";
import { bancoConfigurado, dono, insere, linkTemporario } from "@/lib/admin";
import { avisaOrcamentoAoLojista, confirmaOrcamentoAoCliente } from "@/lib/email";

/**
 * Pedido de orçamento vindo do site.
 *
 * Antes esta rota não existia: o formulário trocava de tela e dizia "recebemos
 * seu projeto" sem gravar nada. Quem pediu orçamento ficou esperando uma
 * resposta que nunca ia sair.
 *
 * Os arquivos já subiram direto para o Storage antes de chegar aqui — o que
 * vem no corpo são só os caminhos deles. A conferência de extensão e tamanho
 * ficou em /api/orcamento/arquivo, que é quem autoriza cada envio.
 */

export const dynamic = "force-dynamic";

const LIMITES = {
  empresa: 140,
  nome: 120,
  email: 160,
  telefone: 40,
  descricao: 4000,
  escolha: 80,
  arquivos: 5,
};

type ArquivoRecebido = { nome?: unknown; caminho?: unknown; tamanho?: unknown };

const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(requisicao: Request) {
  if (!bancoConfigurado) {
    console.error("[orcamento] Faltam as variáveis do Supabase.");
    return NextResponse.json(
      {
        ok: false,
        recado:
          "O formulário está fora do ar. Chame a gente no WhatsApp que a " +
          "gente resolve por lá.",
      },
      { status: 503 },
    );
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi o envio." }, { status: 400 });
  }

  // Campo invisível na tela. Gente preenche o que vê; robô preenche tudo. Se
  // veio com conteúdo, respondemos "deu certo" e jogamos fora — reclamar só
  // ensinaria o robô a contornar.
  if (texto(corpo.site, 10)) {
    return NextResponse.json({ ok: true, id: "—" });
  }

  const nome = texto(corpo.nome, LIMITES.nome);
  const email = texto(corpo.email, LIMITES.email);
  const telefone = texto(corpo.telefone, LIMITES.telefone);
  const descricao = texto(corpo.descricao, LIMITES.descricao);
  // Campos da página de brindes. No orçamento comum eles chegam vazios.
  const empresa = texto(corpo.empresa, LIMITES.empresa);
  const documento = texto(corpo.documento, 20).replace(/\D/g, "");
  const origem = corpo.origem === "brindes" ? "brindes" : "site";

  if (!nome) {
    return NextResponse.json(
      { ok: false, recado: "Preciso do seu nome para responder." },
      { status: 400 },
    );
  }
  if (!email && !telefone) {
    return NextResponse.json(
      { ok: false, recado: "Deixe um e-mail ou um telefone — senão não tenho como responder." },
      { status: 400 },
    );
  }

  const arquivos = (Array.isArray(corpo.arquivos) ? corpo.arquivos : [])
    .slice(0, LIMITES.arquivos)
    .map((a: ArquivoRecebido) => ({
      nome: texto(a?.nome, 120),
      caminho: texto(a?.caminho, 300),
      tamanho: Math.max(0, Number(a?.tamanho) || 0),
    }))
    // Só entra caminho que este servidor mesmo assinou, dentro da pasta do
    // dono. Caminho inventado não vira linha no banco.
    .filter((a) => a.caminho.startsWith(`${dono}/orcamentos/`));

  const id = `ORC-${Date.now().toString(36).toUpperCase()}`;

  const linha: Record<string, unknown> = {
    id,
    usuario: dono,
    nome,
    email: email || null,
    telefone: telefone || null,
    quantidade: Math.max(1, Math.min(9999, Number(corpo.quantidade) || 1)),
    material: texto(corpo.material, LIMITES.escolha) || null,
    acabamento: texto(corpo.acabamento, LIMITES.escolha) || null,
    prazo: texto(corpo.prazo, LIMITES.escolha) || null,
    descricao: descricao || null,
    arquivos,
  };

  let gravado = await insere("orcamentos_loja", {
    ...linha,
    empresa: empresa || null,
    documento: documento || null,
    origem,
  });

  // Enquanto o supabase-brindes.sql não for rodado, o banco não conhece essas
  // três colunas e recusa a linha inteira — um pedido de empresa se perderia
  // por causa de uma migração pendente. Neste caso ele entra sem elas, e o que
  // seria coluna vira as primeiras linhas da descrição, que é onde você lê.
  if (!gravado.ok && /empresa|documento|origem|PGRST204/i.test(gravado.erro)) {
    console.error(
      "[orcamento] O banco não conhece as colunas de empresa — rode o supabase-brindes.sql.",
    );
    const cabecalho = [
      empresa ? `Empresa: ${empresa}` : "",
      documento ? `CNPJ/CPF: ${documento}` : "",
      origem === "brindes" ? "Origem: página de brindes" : "",
    ]
      .filter(Boolean)
      .join("\n");

    gravado = await insere("orcamentos_loja", {
      ...linha,
      descricao: [cabecalho, descricao].filter(Boolean).join("\n\n") || null,
    });
  }

  if (!gravado.ok) {
    // Erro de verdade, e a tela precisa dizer isso. Fingir que deu certo é o
    // que estragava este formulário antes.
    return NextResponse.json(
      {
        ok: false,
        recado:
          "Não consegui registrar seu pedido agora. Tente de novo em instantes " +
          "ou mande pelo WhatsApp.",
      },
      { status: 502 },
    );
  }

  // Daqui para frente nada derruba a solicitação: ela já está gravada e vai
  // aparecer no Precifica mesmo se o e-mail falhar.
  const comLink = await Promise.all(
    arquivos.map(async (a) => ({ ...a, url: await linkTemporario(a.caminho) })),
  );

  const solicitacao = {
    id,
    empresa,
    documento,
    origem,
    nome,
    email,
    telefone,
    quantidade: Math.max(1, Number(corpo.quantidade) || 1),
    material: texto(corpo.material, LIMITES.escolha),
    acabamento: texto(corpo.acabamento, LIMITES.escolha),
    prazo: texto(corpo.prazo, LIMITES.escolha),
    descricao,
    arquivos: comLink,
  };

  const [, avisoAoCliente] = await Promise.all([
    avisaOrcamentoAoLojista(solicitacao).catch(() => false),
    confirmaOrcamentoAoCliente(solicitacao).catch(() => false),
  ]);

  return NextResponse.json({ ok: true, id, avisoAoCliente });
}
