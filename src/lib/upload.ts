/**
 * Envio de arquivo do navegador direto para o Storage.
 *
 * O servidor só assina a permissão; o arquivo vai daqui para lá sem passar
 * pela nossa API. É o que permite mandar um STL de 40 MB — pela rota normal
 * ele bateria no limite de tamanho da hospedagem e o envio morreria bem nos
 * projetos maiores, que são justamente os que interessam.
 *
 * Mora aqui, e não dentro de um formulário, porque dois formulários usam o
 * mesmo caminho: o orçamento sob medida e o pedido de brindes. Duas cópias
 * seriam dois lugares para corrigir quando o limite ou o formato mudar.
 */

export type Anexo = { nome: string; caminho: string; tamanho: number };

export async function sobeArquivo(file: File, pasta: string): Promise<Anexo> {
  const permissao = await fetch("/api/orcamento/arquivo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: file.name, tamanho: file.size, pasta }),
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
}
