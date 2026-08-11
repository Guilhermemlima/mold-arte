import type { Metadata } from "next";
import { Suspense } from "react";
import ShopClient from "@/components/loja/ShopClient";
import PageHeader from "@/components/PageHeader";
import { getAllProducts, getCategories } from "@/data/products";

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Catálogo completo da Moldarte 3D: decoração, luminárias, colecionáveis, peças técnicas e presentes personalizados.",
};

type SearchParams = Promise<{ q?: string; categoria?: string }>;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);
  // Lemos os filtros aqui no servidor: a listagem já chega renderizada com o
  // resultado certo (bom para SEO e sem "piscar" a lista completa antes).
  const { q, categoria } = await searchParams;

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Tudo que sai das nossas impressoras"
        description="Peças produzidas sob demanda, uma a uma. Filtre por categoria, preço ou vá direto na busca."
        breadcrumbs={[{ label: "Loja" }]}
      />

      <Suspense fallback={<ShopSkeleton />}>
        <ShopClient
          products={products}
          categories={categories}
          initialQuery={q ?? ""}
          initialCategory={categoria ?? null}
        />
      </Suspense>
    </>
  );
}

function ShopSkeleton() {
  return (
    <div className="container-x grid gap-10 pb-24 lg:grid-cols-[16rem_1fr] lg:gap-12">
      <div className="hidden h-96 rounded-2xl lg:block skeleton" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
