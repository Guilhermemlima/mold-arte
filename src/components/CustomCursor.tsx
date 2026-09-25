"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Cursor customizado: um ponto ciano que fica exatamente onde o mouse está e
 * um anel que vem logo atrás. Desativado em toque e quando o usuário pede
 * menos movimento.
 *
 * O ponto não tem animação nenhuma, e isso é o recurso, não uma economia. Como
 * o cursor do sistema fica escondido, o ponto é o cursor — e cursor que chega
 * atrasado não parece um efeito bonito, parece computador travando. Antes ele
 * tinha um easing de 0,12 s; no papel é pouco, na mão é o suficiente para a
 * pessoa sentir que o site não responde. O comentário aqui dizia "segue o mouse
 * na hora" e o código fazia outra coisa.
 *
 * O atraso ficou só no anel, que é decorativo: ele pode chegar depois porque
 * ninguém o confunde com a ponta do cursor.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("cursor-none-desktop");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    // quickSetter escreve na hora, sem criar tween. É o caminho mais curto
    // entre o evento do mouse e o pixel na tela.
    const poeDotX = gsap.quickSetter(dot, "x", "px");
    const poeDotY = gsap.quickSetter(dot, "y", "px");
    // O anel continua com inércia, mas bem menos: meio segundo deixava ele a
    // um palmo do cursor num movimento rápido.
    const anelX = gsap.quickTo(ring, "x", { duration: 0.18, ease: "power3.out" });
    const anelY = gsap.quickTo(ring, "y", { duration: 0.18, ease: "power3.out" });

    let x = 0;
    let y = 0;
    let moveu = false;
    let visible = false;

    const onMove = (event: MouseEvent) => {
      x = event.clientX;
      y = event.clientY;
      moveu = true;

      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      anelX(x);
      anelY(y);
    };

    /**
     * Uma escrita por quadro, e não uma por evento.
     *
     * O mouse dispara mais eventos do que a tela desenha quadros; escrever a
     * cada evento é trabalho jogado fora, e trabalho jogado fora no caminho do
     * mouse é exatamente o que vira engasgo.
     */
    const porQuadro = () => {
      if (!moveu) return;
      poeDotX(x);
      poeDotY(y);
      moveu = false;
    };
    gsap.ticker.add(porQuadro);

    const interativo = 'a, button, [role="button"], input, select, textarea, label';

    /**
     * O anel só reage quando o elemento embaixo do cursor realmente muda.
     *
     * Antes havia um par de listeners de mouseover/mouseout que criava quatro
     * tweens a cada troca — e mouseover dispara também ao passar de um filho
     * para o outro dentro do mesmo link. Atravessar um card com ícone e texto
     * disparava a animação várias vezes seguidas, cada uma cancelando a
     * anterior: o anel pulsava e a página gastava quadro com isso bem na hora
     * em que o cursor precisava deles.
     */
    let alvoAtual: Element | null = null;

    const onPointerOver = (event: PointerEvent) => {
      const alvo = (event.target as HTMLElement).closest(interativo);
      if (alvo === alvoAtual) return;
      alvoAtual = alvo;

      gsap.to(ring, {
        scale: alvo ? 1.9 : 1,
        borderColor: alvo ? "rgba(56,216,245,0.9)" : "rgba(139,160,184,0.45)",
        duration: 0.3,
        ease: "power3.out",
      });
      gsap.to(dot, { scale: alvo ? 0.4 : 1, duration: 0.3, ease: "power3.out" });
    };

    const onLeaveWindow = () => {
      visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      document.documentElement.classList.remove("cursor-none-desktop");
      gsap.ticker.remove(porQuadro);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("mouseleave", onLeaveWindow);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200] hidden md:block">
      <div
        ref={ringRef}
        className="fixed left-0 top-0 h-8 w-8 rounded-full border"
        // will-change avisa o navegador para deixar os dois numa camada
        // própria. Sem isso, cada movimento pode repintar o que está atrás —
        // e o ponto tem um brilho borrado, que é caro de repintar.
        style={{ borderColor: "rgba(139,160,184,0.45)", willChange: "transform" }}
      />
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-cyan-400"
        style={{ boxShadow: "0 0 12px rgba(56,216,245,0.9)", willChange: "transform" }}
      />
    </div>
  );
}
