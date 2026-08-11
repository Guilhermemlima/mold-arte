import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CartPageClient from "@/components/carrinho/CartPageClient";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise os itens do seu pedido antes de finalizar a compra.",
};

export default function CartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pedido"
        title="Seu carrinho"
        breadcrumbs={[{ label: "Carrinho" }]}
      />
      <CartPageClient />
    </>
  );
}
