import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "@/components/produto/ProductClient";
import Avaliacoes from "@/components/produto/Avaliacoes";
import { avaliacoesDoProduto, resumo } from "@/lib/avaliacoes";
import ProductCard from "@/components/ProductCard";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import {
  getAllProducts,
  getCategory,
  getProductBySlug,
  getRelatedProducts,
} from "@/data/products";
import { site, siteUrl } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

// Gera as páginas de produto no build (rápidas e boas para SEO).
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Produto não encontrado" };

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} · ${site.name}`,
      description: product.shortDescription,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [related, category, avaliacoes] = await Promise.all([
    getRelatedProducts(product),
    getCategory(product.category),
    avaliacoesDoProduto(product.slug),
  ]);

  // A nota do produto vem das avaliações reais, nunca de um número escrito à
  // mão. Sem avaliação, o produto simplesmente não tem nota — e a tela some
  // com as estrelas em vez de mostrar cinco vazias.
  const notas = resumo(avaliacoes);
  const comNota = notas
    ? { ...product, rating: notas.nota, reviews: notas.quantas }
    : product;

  return (
    <>
      {/* Rich snippet de produto para o Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: comNota.name,
            description: comNota.description,
            sku: comNota.id,
            brand: { "@type": "Brand", name: site.name },
            // Só declaramos nota quando ela existe de verdade. Enviar
            // avaliação inventada para o Google é motivo de penalização.
            ...(typeof comNota.rating === "number" && comNota.reviews
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: comNota.rating,
                    reviewCount: comNota.reviews,
                  },
                }
              : {}),
            offers: {
              "@type": "Offer",
              price: comNota.price,
              priceCurrency: "BRL",
              availability:
                comNota.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url: `${siteUrl}/produto/${comNota.slug}`,
            },
          }),
        }}
      />

      <PageHeader
        breadcrumbs={[
          { label: "Loja", href: "/loja" },
          ...(category
            ? [{ label: category.name, href: `/loja?categoria=${category.slug}` }]
            : []),
          { label: comNota.name },
        ]}
      />

      <ProductClient product={comNota} />

      <Avaliacoes lista={avaliacoes} resumo={notas} />

      {/* Relacionados */}
      <section className="container-x pb-24">
        <Reveal className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
              <span className="h-px w-10 bg-cyan-400" />
              Combina com
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Quem viu esta peça também levou
            </h2>
          </div>
        </Reveal>

        <Reveal stagger={0.08} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </Reveal>
      </section>
    </>
  );
}
