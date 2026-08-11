import type { MetadataRoute } from "next";
import { getAllProducts, categories } from "@/data/products";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const now = new Date();

  const staticPages = ["", "/loja", "/orcamento", "/sobre", "/contato"].map(
    (path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  // Categorias com destino próprio já entram na lista de páginas fixas.
  const categoryPages = categories
    .filter((category) => !category.href)
    .map((category) => ({
      url: `${site.url}/loja?categoria=${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const productPages = products.map((product) => ({
    url: `${site.url}/produto/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
