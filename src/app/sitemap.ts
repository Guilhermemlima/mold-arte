import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/data/products";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);
  const now = new Date();

  const staticPages = [
    "",
    "/loja",
    "/orcamento",
    "/sobre",
    "/contato",
    // Página de dúvidas responde no Google a pergunta que a pessoa digita
    // antes de comprar, então precisa estar no mapa do site.
    "/duvidas",
    "/termos",
    "/privacidade",
    "/trocas",
  ].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  // Categorias com destino próprio já entram na lista de páginas fixas.
  const categoryPages = categories
    .filter((category) => !category.href)
    .map((category) => ({
      url: `${siteUrl}/loja?categoria=${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const productPages = products.map((product) => ({
    url: `${siteUrl}/produto/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
