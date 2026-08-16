import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/ScrollProgress";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFab from "@/components/WhatsAppFab";
import { site, siteUrl } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "impressão 3d",
    "peças 3d",
    "moldarte",
    "protótipo 3d",
    "decoração 3d",
    "peças personalizadas",
    "modelagem 3d",
  ],
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    // Arte completa (com wordmark) — é a miniatura que aparece quando o link
    // é colado no WhatsApp, Instagram, Facebook etc.
    images: [
      {
        url: "/logo-full.png",
        width: 1402,
        height: 1122,
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: ["/logo-full.png"],
  },
  // O favicon vem dos arquivos src/app/icon.png e src/app/apple-icon.png
  // (convenção do Next), que são a própria logo da marca.
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05090f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Rede de segurança: sem JavaScript, os blocos que dependem da
            animação de entrada ficariam invisíveis. Aqui eles aparecem. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important}`}</style>
        </noscript>
      </head>
      <body>
        {/* Dados estruturados para o Google entender a loja */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: site.name,
              description: site.description,
              url: siteUrl,
              image: `${siteUrl}/logo-full.png`,
              email: site.contact.email,
              priceRange: "R$$",
            }),
          }}
        />

        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-full focus:bg-white focus:px-5 focus:py-2.5 focus:font-semibold focus:text-ink"
        >
          Pular para o conteúdo
        </a>

        <ToastProvider>
          <CartProvider>
            <Preloader />
            <SmoothScroll />
            <CustomCursor />
            <ScrollProgress />

            <Header />
            <main id="conteudo">{children}</main>
            <Footer />

            <CartDrawer />
            <WhatsAppFab />

            {/* Contagem de visitas.
                Sem cookie e sem identificar ninguém: conta quantas pessoas
                entraram, de onde vieram e em que página desistiram. É o que
                permite saber se o problema é a loja ou o checkout — sem isso
                qualquer decisão sobre o site é chute. Como não usa cookie, não
                exige aquele aviso de consentimento. */}
            <Analytics />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
