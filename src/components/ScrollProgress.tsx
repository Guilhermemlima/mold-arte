"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/** Fio ciano no topo mostrando quanto da página já foi lido. */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setWidth = gsap.quickTo(el, "scaleX", {
      duration: 0.25,
      ease: "power2.out",
    });

    /**
     * A altura da página é lida fora do scroll, de propósito.
     *
     * `scrollHeight` obriga o navegador a recalcular o layout na hora de
     * responder. Lendo isso a cada evento de rolagem — e com o scroll suave
     * são uns sessenta por segundo —, a página parava para se medir sessenta
     * vezes por segundo. O efeito não aparece na barrinha: aparece em tudo o
     * mais que precisava daquele quadro, o cursor inclusive.
     *
     * A altura só muda quando o conteúdo ou a janela mudam, e é aí que ela é
     * lida de novo.
     */
    let max = 0;
    const mede = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };

    const onScroll = () => {
      setWidth(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    mede();
    onScroll();

    // Imagem que carrega, seção que abre, filtro que muda a lista: tudo isso
    // muda a altura sem passar por resize nenhum.
    const observador = new ResizeObserver(() => {
      mede();
      onScroll();
    });
    observador.observe(document.body);

    const onResize = () => {
      mede();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      observador.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[95] h-0.5" aria-hidden>
      <div
        ref={ref}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-steel-500 via-cyan-400 to-cyan-300"
        style={{ boxShadow: "0 0 12px rgba(56,216,245,0.6)" }}
      />
    </div>
  );
}
