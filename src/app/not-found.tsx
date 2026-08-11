import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden py-20">
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
      <div
        className="absolute left-1/2 top-1/3 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-steel-600/20 blur-[120px]"
        aria-hidden
      />

      <div className="container-x relative text-center">
        <p className="font-display text-[clamp(5rem,20vw,12rem)] font-bold leading-none text-gradient">
          404
        </p>

        <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
          Essa peça não saiu da impressora
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-silver-400">
          O endereço que você tentou abrir não existe — ou o produto saiu do
          catálogo. Que tal voltar para a loja?
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/loja"
            className="rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
          >
            Ir para a loja
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  );
}
