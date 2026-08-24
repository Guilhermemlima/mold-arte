/**
 * Conferência de CPF e CNPJ.
 *
 * Existe porque o Asaas recusa cobrança com documento inválido, e a recusa
 * acontece tarde: o pedido já foi criado, o estoque já foi reservado, e o
 * cliente cai numa tela sem botão de pagar, sem entender por quê. Um dígito
 * trocado vira uma venda perdida.
 *
 * Aqui o erro aparece no campo, na hora, enquanto ainda é só um erro de
 * digitação. Os dois algoritmos são os oficiais da Receita: os últimos
 * dígitos são calculados a partir dos anteriores, então número inventado
 * quase nunca fecha a conta.
 */

const soDigitos = (v: string) => String(v ?? "").replace(/\D/g, "");

/** Todos os dígitos iguais passam na conta, mas não existem na vida real. */
const todosIguais = (d: string) => /^(\d)\1+$/.test(d);

export function cpfValido(valor: string) {
  const d = soDigitos(valor);
  if (d.length !== 11 || todosIguais(d)) return false;

  // Cada dígito verificador vem da soma ponderada dos anteriores.
  for (let posicao = 9; posicao < 11; posicao += 1) {
    let soma = 0;
    for (let i = 0; i < posicao; i += 1) {
      soma += Number(d[i]) * (posicao + 1 - i);
    }
    const resto = (soma * 10) % 11;
    const esperado = resto === 10 ? 0 : resto;
    if (esperado !== Number(d[posicao])) return false;
  }
  return true;
}

export function cnpjValido(valor: string) {
  const d = soDigitos(valor);
  if (d.length !== 14 || todosIguais(d)) return false;

  const confere = (ate: number) => {
    const pesos =
      ate === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
                 : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < ate; i += 1) soma += Number(d[i]) * pesos[i];
    const resto = soma % 11;
    return (resto < 2 ? 0 : 11 - resto) === Number(d[ate]);
  };

  return confere(12) && confere(13);
}

/** Aceita os dois: pessoa física ou empresa. */
export function documentoValido(valor: string) {
  const d = soDigitos(valor);
  if (d.length === 11) return cpfValido(d);
  if (d.length === 14) return cnpjValido(d);
  return false;
}

/** Escreve com pontuação enquanto a pessoa digita. */
export function formataDocumento(valor: string) {
  const d = soDigitos(valor).slice(0, 14);

  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}
