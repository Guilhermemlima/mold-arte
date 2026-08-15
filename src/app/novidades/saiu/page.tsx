import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { site, whatsappLink } from "@/lib/site";

/** Confirmação de que a pessoa saiu da lista de novidades. */

export const metadata: Metadata = {
  title: "Você saiu da lista",
  robots: { index: false, follow: false },
};

export default async function SaiuPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <>
      <PageHeader
        eyebrow="Novidades"
        title={erro ? "Não consegui te tirar da lista" : "Pronto, você saiu"}
        description={
          erro
            ? "O link pode estar incompleto — às vezes ele quebra ao ser copiado."
            : "Não vamos mais mandar e-mail de lançamento para você."
        }
      />

      <div className="container-x pb-28">
        <div className="glass border-glow mx-auto max-w-xl rounded-3xl p-8 text-center">
          {erro ? (
            <p className="text-sm leading-relaxed text-silver-400">
              Tente abrir o link direto pelo e-mail. Se não funcionar, me chame
              no WhatsApp{" "}
              <a
                href={whatsappLink("Olá! Quero sair da lista de novidades do site.")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cyan-400 underline"
              >
                {site.contact.whatsappLabel}
              </a>{" "}
              que eu tiro na hora.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-silver-400">
              Isso não cancela nenhuma compra nem apaga seus pedidos — só os
              avisos de peça nova. Se mudar de ideia, é só se cadastrar de novo
              no rodapé do site.
            </p>
          )}

          <Link
            href="/"
            className="mt-7 inline-flex rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </>
  );
}
