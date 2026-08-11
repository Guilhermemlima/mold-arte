"use client";

import { useEffect, useState } from "react";
import { site, whatsappLink } from "@/lib/site";
import { cx } from "@/lib/format";

/** Botão flutuante de WhatsApp — aparece depois que o usuário desce um pouco. */
export default function WhatsAppFab() {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mostra o balãozinho uma vez, alguns segundos depois de aparecer.
  useEffect(() => {
    if (!visible) return;
    const show = setTimeout(() => setHint(true), 1200);
    const hide = setTimeout(() => setHint(false), 7000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [visible]);

  return (
    <div
      className={cx(
        "fixed bottom-5 left-5 z-[80] flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:bottom-6 sm:left-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <a
        href={whatsappLink(
          "Olá! Vim pelo site da Moldarte 3D e queria tirar uma dúvida.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="relative flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.7)] transition-transform duration-300 hover:scale-110"
        style={{ width: 52, height: 52 }}
      >
        <span
          className="absolute inset-0 rounded-full bg-[#25D366]"
          style={{ animation: "pulse-ring 2.4s ease-out infinite" }}
          aria-hidden
        />
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="relative">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15s-.77.96-.94 1.16c-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.53 0-3.03-.41-4.34-1.19l-.31-.18-3.22.84.86-3.14-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.36-8.23 8.36z" />
        </svg>
      </a>

      <div
        className={cx(
          "glass hidden rounded-xl px-3.5 py-2 text-xs text-silver-200 shadow-card transition-all duration-400 sm:block",
          hint ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0",
        )}
      >
        Dúvida na peça? Chama no{" "}
        <strong className="text-white">{site.contact.whatsappLabel}</strong>
      </div>
    </div>
  );
}
