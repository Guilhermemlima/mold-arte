import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Libere aqui os domínios das imagens dos produtos quando plugar no backend/CDN.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
