import type { ReactNode } from "react";

/**
 * Tipografia comum às páginas legais. Texto de contrato precisa ser fácil de
 * varrer com o olho: título curto, parágrafo curto, e nada de parede de texto.
 */

export function Secao({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/8 py-8">
      <h2 className="font-display text-xl font-bold text-white">
        <span className="mr-3 text-cyan-400 tabular-nums">
          {String(numero).padStart(2, "0")}
        </span>
        {titulo}
      </h2>
      <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-silver-400">
        {children}
      </div>
    </section>
  );
}

export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Destaque({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-5 py-4 text-silver-200">
      {children}
    </p>
  );
}

/** Data da última mudança, para o cliente saber que versão está lendo. */
export function Atualizado({ em }: { em: string }) {
  return (
    <p className="mt-10 border-t border-white/8 pt-6 text-xs text-muted">
      Última atualização: {em}. Podemos mudar este texto a qualquer momento; a
      versão que vale para o seu pedido é a que estava publicada no dia em que
      você comprou.
    </p>
  );
}
