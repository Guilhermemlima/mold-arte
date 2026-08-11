import Reveal from "@/components/Reveal";

const materials = [
  {
    name: "PLA",
    highlight: "Detalhe e cor",
    body: "Ótimo acabamento e a maior variedade de cores. Ideal para decoração e peças que ficam dentro de casa.",
    temp: "Até 55 °C",
  },
  {
    name: "PETG",
    highlight: "Resistência",
    body: "Aguenta impacto, umidade e sol. É o que usamos em peças funcionais e itens que vão para a área externa.",
    temp: "Até 75 °C",
  },
  {
    name: "ABS",
    highlight: "Calor e usinagem",
    body: "Suporta temperatura alta e aceita lixamento e acetona para acabamento liso de fábrica.",
    temp: "Até 95 °C",
  },
  {
    name: "Resina",
    highlight: "Precisão extrema",
    body: "Camada de 0,03 mm para miniaturas, joias e peças com detalhe minúsculo que o filamento não alcança.",
    temp: "Até 60 °C",
  },
];

export default function Materials() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="container-x">
        {/* Materiais */}
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal from="left">
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
              <span className="h-px w-10 bg-cyan-400" />
              Materiais
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Cada peça pede um{" "}
              <span className="text-gradient">material diferente</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-silver-400">
              Não existe filamento que sirva para tudo. A gente escolhe junto com
              você olhando para onde a peça vai ficar, quanto esforço vai sofrer e
              qual acabamento você espera.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Perfil de fatiamento ajustado peça a peça",
                "Reforço estrutural onde a peça sofre esforço",
                "Amostra antes da produção em lote",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-silver-200">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-cyan-400">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal from="right" stagger={0.08} className="grid gap-4 sm:grid-cols-2">
            {materials.map((material) => (
              <article
                key={material.name}
                className="glass border-glow group relative overflow-hidden rounded-2xl p-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
              >
                <div className="bg-layers absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex items-baseline justify-between">
                  <h3 className="font-display text-2xl font-bold text-white">
                    {material.name}
                  </h3>
                  <span className="rounded-full border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-medium text-cyan-400">
                    {material.temp}
                  </span>
                </div>
                <p className="relative mt-1 text-[11px] uppercase tracking-[0.2em] text-cyan-400/70">
                  {material.highlight}
                </p>
                <p className="relative mt-3 text-sm leading-relaxed text-silver-400">
                  {material.body}
                </p>
              </article>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
