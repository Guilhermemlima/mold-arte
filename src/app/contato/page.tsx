import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/contato/ContactForm";
import Reveal from "@/components/Reveal";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Moldarte 3D por WhatsApp, e-mail ou pelo formulário. Respondemos em até 24 horas úteis.",
};

const faq = [
  {
    q: "Qual o prazo de entrega?",
    a: "O prazo de produção aparece em cada produto (de 2 a 7 dias úteis) e começa depois da confirmação do pagamento. O frete entra depois disso e varia conforme a região.",
  },
  {
    q: "Vocês entregam em todo o Brasil?",
    a: "Sim, por Correios e transportadora, sempre com código de rastreio. Acima de R$ 299 o frete é por nossa conta.",
  },
  {
    q: "E se a peça chegar quebrada?",
    a: "Manda a foto em até 7 dias que reimprimimos e reenviamos sem custo nenhum. Embalamos com reforço justamente para isso não acontecer, mas quando acontece, é por nossa conta.",
  },
  {
    q: "Dá para mudar a cor de um produto do catálogo?",
    a: "Dá. As cores disponíveis aparecem na página do produto, e se você quiser uma que não está lá, chama no WhatsApp que a gente vê se tem o filamento.",
  },
  {
    q: "Vocês emitem nota fiscal?",
    a: "Sim, em todos os pedidos. Basta informar CPF ou CNPJ no checkout.",
  },
  {
    q: "Como cuido da peça depois?",
    a: "Pano úmido com sabão neutro resolve. Evite deixar no carro fechado sob sol forte — PLA amolece a partir de 55 °C. Se a peça vai ficar exposta ao tempo, peça em PETG.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fale com a gente"
        title="Tem uma dúvida? Manda."
        description="Respondemos rápido — normalmente no mesmo dia útil. Escolha o canal que for mais confortável para você."
        breadcrumbs={[{ label: "Contato" }]}
      />

      <div className="container-x grid gap-12 pb-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* Canais */}
        <Reveal from="left" className="space-y-4">
          <a
            href={whatsappLink("Olá! Vim pelo site da Moldarte 3D.")}
            target="_blank"
            rel="noopener noreferrer"
            className="glass border-glow group flex items-start gap-4 rounded-2xl p-6 transition-transform duration-400 hover:-translate-y-1"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/12 text-[#25D366]">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-base font-bold text-white">
                WhatsApp
              </span>
              <span className="mt-0.5 block text-sm text-silver-400">
                {site.contact.whatsappLabel}
              </span>
              <span className="mt-2 block text-xs text-cyan-400">
                O jeito mais rápido de falar com a gente
              </span>
            </span>
          </a>

          <a
            href={`mailto:${site.contact.email}`}
            className="glass border-glow group flex items-start gap-4 rounded-2xl p-6 transition-transform duration-400 hover:-translate-y-1"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-cyan-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-base font-bold text-white">
                E-mail
              </span>
              <span className="mt-0.5 block break-all text-sm text-silver-400">
                {site.contact.email}
              </span>
              <span className="mt-2 block text-xs text-cyan-400">
                Melhor para orçamento com arquivo anexo
              </span>
            </span>
          </a>

          <a
            href={site.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="glass border-glow group flex items-start gap-4 rounded-2xl p-6 transition-transform duration-400 hover:-translate-y-1"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-cyan-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-base font-bold text-white">
                Instagram
              </span>
              <span className="mt-0.5 block text-sm text-silver-400">
                @moldarte3d
              </span>
              <span className="mt-2 block text-xs text-cyan-400">
                Bastidores da produção e peças novas
              </span>
            </span>
          </a>

          <div className="glass rounded-2xl p-6">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Horário de atendimento
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-silver-400">Segunda a sexta</dt>
                <dd className="text-white">9h às 18h</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-silver-400">Sábado</dt>
                <dd className="text-white">9h às 13h</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-silver-400">Domingo</dt>
                <dd className="text-muted">Fechado</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              As impressoras seguem rodando fora do horário — só o atendimento
              humano que dorme.
            </p>
          </div>
        </Reveal>

        {/* Formulário */}
        <Reveal from="right">
          <ContactForm />
        </Reveal>
      </div>

      {/* FAQ */}
      <section className="container-x pb-24">
        <Reveal className="mb-10">
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
            <span className="h-px w-10 bg-cyan-400" />
            Dúvidas frequentes
          </p>
          <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Talvez a sua resposta{" "}
            <span className="text-gradient">já esteja aqui</span>
          </h2>
        </Reveal>

        <Reveal stagger={0.06} className="grid gap-3 lg:grid-cols-2">
          {faq.map((item) => (
            <details
              key={item.q}
              className="glass border-glow group rounded-xl px-6 py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-white">
                {item.q}
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="shrink-0 text-cyan-400 transition-transform duration-300 group-open:rotate-45"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="mt-3.5 text-sm leading-relaxed text-silver-400">
                {item.a}
              </p>
            </details>
          ))}
        </Reveal>
      </section>
    </>
  );
}
