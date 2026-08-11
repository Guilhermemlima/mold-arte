import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize seu pedido na Moldarte 3D.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Falta pouco"
        title="Finalizar pedido"
        breadcrumbs={[{ label: "Carrinho", href: "/carrinho" }, { label: "Checkout" }]}
      />
      <CheckoutClient />
    </>
  );
}
