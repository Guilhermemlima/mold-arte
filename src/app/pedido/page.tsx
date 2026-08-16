import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import AcompanharClient from "@/components/pedido/AcompanharClient";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  description:
    "Veja em que etapa está o seu pedido da Moldarte 3D: pagamento, produção " +
    "e envio, com o código de rastreio dos Correios. Sem criar conta.",
};

export default function AcompanharPedidoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Meu pedido"
        title="Onde está a sua peça"
        description="Informe o número do pedido e o e-mail da compra. Não precisa criar conta."
        breadcrumbs={[{ label: "Acompanhar pedido" }]}
      />
      <div className="container-x pb-28">
        <AcompanharClient />
      </div>
    </>
  );
}
