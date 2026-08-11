import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
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
import { site } from "@/lib/site";

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
  metadataBase: new URL(site.url),
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
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
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
              url: site.url,
              image: `${site.url}/logo.png`,
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
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
