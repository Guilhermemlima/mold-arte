/**
 * Cabeçalhos para as rotas que o Precifica chama.
 *
 * O Precifica roda num endereço próprio e a loja em outro, então toda chamada
 * dele é entre origens diferentes. Quando ela leva um cabeçalho fora do
 * comum — o `x-cron-secret` — o navegador manda antes um pedido de permissão
 * (OPTIONS) e só prossegue se a resposta autorizar aquele cabeçalho por nome.
 * Sem isso a requisição nem chega a sair, e do lado de cá parece que a loja
 * está fora do ar.
 *
 * Liberar qualquer origem é seguro aqui porque **CORS não é a tranca**: quem
 * protege estas rotas é o segredo no cabeçalho. O navegador de um estranho até
 * pode tentar a chamada; sem a chave ela volta 401.
 */
export const cabecalhosCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-cron-secret",
  "Access-Control-Max-Age": "86400",
} as const;

/** Junta os cabeçalhos de CORS à resposta que a rota já ia devolver. */
export function comCors(resposta: Response) {
  Object.entries(cabecalhosCors).forEach(([chave, valor]) => {
    resposta.headers.set(chave, valor);
  });
  return resposta;
}
