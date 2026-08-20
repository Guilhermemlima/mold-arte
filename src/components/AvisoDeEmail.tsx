/**
 * Aviso de onde procurar o e-mail que a loja acabou de prometer.
 *
 * Existe porque a promessa sozinha nao basta: o Gmail joga e-mail com cupom
 * ou com cara de novidade direto em Promocoes, e quem procura na caixa
 * principal conclui que nada chegou — as vezes que a loja e golpe.
 *
 * O pedido para marcar "nao e spam" nao e enfeite: e o que ensina o provedor
 * a entregar os proximos na caixa certa.
 */
export default function AvisoDeEmail({
  oQue = "o e-mail",
}: {
  /** Como chamar o que foi enviado: "o cupom", "a confirmação"… */
  oQue?: string;
}) {
  return (
    <p className="mx-auto mt-5 max-w-sm rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-[11px] leading-relaxed text-silver-400">
      <strong className="text-silver-200">Não achou {oQue}?</strong> Olhe na
      aba <strong className="text-silver-200">Promoções</strong> e no{" "}
      <strong className="text-silver-200">spam</strong> — e, se estiver lá,
      marque como &ldquo;não é spam&rdquo;. Assim os próximos chegam direto na
      sua caixa principal.
    </p>
  );
}
