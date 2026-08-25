"use client";

import Link from "next/link";
import AvisoDeEmail from "@/components/AvisoDeEmail";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { brl, cx } from "@/lib/format";
import { descontoDoPix } from "@/lib/pagamento";
import { site } from "@/lib/site";
import { documentoValido, formataDocumento } from "@/lib/documento";
import OrderSummary from "./OrderSummary";
import Field from "./Field";

type Step = 1 | 2 | 3;

const steps = [
  { id: 1, label: "Identificação" },
  { id: 2, label: "Entrega" },
  { id: 3, label: "Pagamento" },
] as const;

type PaymentMethod = "pix" | "cartao" | "boleto";

export default function CheckoutClient() {
  const { items, subtotal, discount, total, cupom, clear, defineUf } = useCart();
  const toast = useToast();

  const [step, setStep] = useState<Step>(1);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [loadingCep, setLoadingCep] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const [avisouCliente, setAvisouCliente] = useState(false);
  const [pagamentoUrl, setPagamentoUrl] = useState<string | null>(null);

  // O que o Pix abate, pela mesma regra do banco. Serve para o passo 3 mostrar
  // o valor certo antes de a pessoa escolher.
  const abatePix = descontoDoPix(subtotal, discount);
  // O valor que a cobrança vai ter: é ele que precisa passar do mínimo do
  // Asaas, não o total antes do desconto.
  const totalCobrado = Math.max(0, total - (payment === "pix" ? abatePix : 0));

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    notes: "",
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Busca o endereço pelo CEP (ViaCEP) para o cliente não digitar tudo.
  const lookupCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    update("cep", raw);
    if (cep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Confira o número ou preencha o endereço à mão.",
          variant: "error",
        });
        return;
      }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro ?? prev.street,
        district: data.bairro ?? prev.district,
        city: data.localidade ?? prev.city,
        state: data.uf ?? prev.state,
      }));
      // O frete muda por região: com o estado em mãos, o carrinho já
      // mostra o valor real em vez do "a partir de".
      if (data.uf) defineUf(data.uf);
      toast({ title: "Endereço preenchido", description: `${data.localidade} — ${data.uf}` });
    } catch {
      toast({
        title: "Não deu para buscar o CEP",
        description: "Preencha o endereço manualmente.",
        variant: "error",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  // O documento e conferido de verdade, com digito verificador — nao so pelo
  // tamanho. O Asaas recusa cobranca com documento invalido, e a recusa vem
  // tarde: o pedido ja foi criado, o estoque ja foi reservado, e o cliente
  // cai numa tela sem botao de pagar sem entender o motivo. Um digito
  // trocado virava uma venda perdida.
  const documentoOk = documentoValido(form.document);
  const digitosDoDocumento = form.document.replace(/\D/g, "").length;
  // So reclama quando ja da para saber: enquanto esta curto, ainda digita.
  const documentoErrado =
    !documentoOk && (digitosDoDocumento === 11 || digitosDoDocumento === 14);

  const canAdvance =
    step === 1
      ? form.name.trim().length > 2 &&
        form.email.includes("@") &&
        form.phone.length >= 10 &&
        documentoOk
      : step === 2
        ? form.cep.replace(/\D/g, "").length === 8 &&
          form.street.trim() !== "" &&
          form.number.trim() !== "" &&
          form.city.trim() !== ""
        : true;

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);

    try {
      // O servidor refaz as contas pelo banco e reserva o estoque. O que sai
      // daqui é só o que o cliente escolheu — preço quem decide é lá.
      const resposta = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: items.map((item) => ({
            slug: item.slug,
            quantidade: item.quantity,
            tamanho: item.options["Tamanho"] ?? null,
            opcoes: item.options,
          })),
          cliente: {
            nome: form.name,
            email: form.email,
            telefone: form.phone,
            documento: form.document,
          },
          entrega: {
            cep: form.cep,
            rua: form.street,
            numero: form.number,
            complemento: form.complement,
            bairro: form.district,
            cidade: form.city,
            uf: form.state,
          },
          pagamento: payment,
          observacoes: form.notes,
          cupom: cupom?.codigo ?? null,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.ok) {
        toast({
          title: "Não deu para fechar o pedido",
          description: dados.recado ?? "Tente de novo em instantes.",
          variant: "error",
        });
        // Estoque acabou no meio do caminho: volta para o carrinho, que é
        // onde ele consegue ajustar a quantidade.
        if (dados.erro === "estoque_insuficiente") setStep(1);
        return;
      }

      setPlaced(dados.id);
      setAvisouCliente(Boolean(dados.avisoAoCliente));
      setPagamentoUrl(dados.pagamentoUrl ?? null);
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast({
        title: "Sem conexão com a loja",
        description: "Confira sua internet e tente de novo.",
        variant: "error",
      });
    } finally {
      setEnviando(false);
    }
  };

  /* ---------------------------------------------------------------- Sucesso */
  if (placed) {
    return (
      <div className="container-x pb-28">
        <div className="glass border-glow mx-auto max-w-xl rounded-3xl p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-400">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>

          <h2 className="mt-6 font-display text-3xl font-bold text-white">
            {pagamentoUrl ? "Falta só o pagamento" : "Pedido recebido!"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-silver-400">
            Anota o número do seu pedido:{" "}
            <strong className="font-display text-cyan-400">{placed}</strong>.
            {pagamentoUrl ? (
              <>
                {" "}
                Suas peças estão reservadas. Conclua o pagamento para a produção
                começar.
                {payment === "pix"
                  ? ` A cobrança saiu por Pix, com os ${site.descontoPix}% já` +
                    " descontados. Se preferir cartão ou boleto, chama a gente no" +
                    " WhatsApp que a gente refaz a cobrança — sem o desconto do Pix."
                  : " Dá para pagar por Pix, boleto ou cartão."}
              </>
            ) : avisouCliente ? (
              <>
                {" "}
                Mandamos a confirmação para{" "}
                <strong className="text-white">{form.email}</strong> e a
                produção começa assim que o pagamento cair.
              </>
            ) : (
              <>
                {" "}
                Já recebemos ele aqui e entramos em contato pelo WhatsApp{" "}
                <strong className="text-white">{form.phone || "informado"}</strong>{" "}
                para combinar o pagamento.
              </>
            )}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            As peças ficam reservadas para você por 24 horas. Passado esse
            prazo sem o pagamento, elas voltam para a loja.
          </p>

          {avisouCliente && <AvisoDeEmail oQue="a confirmação" />}

          {pagamentoUrl && (
            <>
              <a
                href={pagamentoUrl}
                className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow"
              >
                Pagar agora
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <p className="mt-3 text-[11px] text-muted">
                Você vai para o ambiente seguro do Asaas. Guarde o número do
                pedido — se fechar a página, é só chamar no WhatsApp que a
                gente reenvia o link.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/loja"
              className={cx(
                "rounded-full px-7 py-3.5 font-semibold transition-all duration-300",
                pagamentoUrl
                  ? "border border-white/15 text-white hover:border-cyan-400/40 hover:text-cyan-300"
                  : "bg-white text-ink hover:bg-cyan-300 hover:shadow-glow",
              )}
            >
              Continuar comprando
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ Carrinho vazio */
  if (items.length === 0) {
    return (
      <div className="container-x pb-28">
        <div className="glass mx-auto max-w-lg rounded-3xl p-12 text-center">
          <h2 className="font-display text-2xl font-bold text-white">
            Não há nada para pagar
          </h2>
          <p className="mt-2 text-sm text-silver-400">
            Seu carrinho está vazio. Escolha uma peça e volte aqui.
          </p>
          <Link
            href="/loja"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition-colors hover:bg-cyan-300"
          >
            Ver a loja
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ Fluxo */
  return (
    <div className="container-x grid gap-10 pb-28 lg:grid-cols-[1fr_22rem] lg:gap-14">
      <form onSubmit={placeOrder}>
        {/* Passos */}
        <ol className="mb-10 flex items-center gap-3">
          {steps.map((item, i) => {
            const done = step > item.id;
            const active = step === item.id;
            return (
              <li key={item.id} className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => item.id < step && setStep(item.id as Step)}
                  disabled={item.id > step}
                  className="flex items-center gap-2.5 disabled:cursor-default"
                >
                  <span
                    className={cx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-400",
                      done
                        ? "border-cyan-400 bg-cyan-400 text-ink"
                        : active
                          ? "border-cyan-400 text-cyan-400"
                          : "border-white/15 text-muted",
                    )}
                  >
                    {done ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                    ) : (
                      item.id
                    )}
                  </span>
                  <span
                    className={cx(
                      "hidden text-sm font-medium transition-colors sm:block",
                      active || done ? "text-white" : "text-muted",
                    )}
                  >
                    {item.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <span
                    className={cx(
                      "h-px flex-1 transition-colors duration-500",
                      done ? "bg-cyan-400" : "bg-white/12",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div className="glass border-glow rounded-2xl p-6 sm:p-8">
          {/* ---------------------------------------------------- Passo 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-white">
                Quem está comprando
              </h2>

              <Field
                label="Nome completo"
                value={form.name}
                onChange={(v) => update("name", v)}
                placeholder="Como está no documento"
                required
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  placeholder="seu@email.com"
                  hint="É para lá que vai a confirmação"
                  required
                />
                <Field
                  label="WhatsApp"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  placeholder="(00) 00000-0000"
                  hint="Avisamos o andamento da produção"
                  required
                />
              </div>
              <Field
                label="CPF ou CNPJ"
                value={form.document}
                onChange={(v) => update("document", formataDocumento(v))}
                placeholder="000.000.000-00"
                hint={
                  documentoErrado
                    ? "Esse número não confere — revise os dígitos."
                    : "Necessário para gerar a cobrança e emitir a nota"
                }
                required
              />
            </div>
          )}

          {/* ---------------------------------------------------- Passo 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-white">
                Para onde enviamos
              </h2>

              <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
                <Field
                  label="CEP"
                  value={form.cep}
                  onChange={lookupCep}
                  placeholder="00000-000"
                  hint={loadingCep ? "Buscando…" : "Preenchemos o resto"}
                  required
                />
                <Field
                  label="Rua"
                  value={form.street}
                  onChange={(v) => update("street", v)}
                  placeholder="Nome da rua"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field
                  label="Número"
                  value={form.number}
                  onChange={(v) => update("number", v)}
                  placeholder="123"
                  required
                />
                <Field
                  label="Complemento"
                  value={form.complement}
                  onChange={(v) => update("complement", v)}
                  placeholder="Apto, bloco…"
                />
                <Field
                  label="Bairro"
                  value={form.district}
                  onChange={(v) => update("district", v)}
                  placeholder="Bairro"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
                <Field
                  label="Cidade"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                  placeholder="Cidade"
                  required
                />
                <Field
                  label="UF"
                  value={form.state}
                  onChange={(v) => {
                    const uf = v.toUpperCase().slice(0, 2);
                    update("state", uf);
                    if (uf.length === 2) defineUf(uf);
                  }}
                  placeholder="SP"
                  required
                />
              </div>

              {/* É aqui que aparece "quero o jogador na pose de comemoração".
                  O exemplo puxa esse tipo de pedido de propósito: quem não é
                  convidado a contar, não conta — e depois de impresso não
                  adianta mais. */}
              <Field
                label="Observações do pedido"
                value={form.notes}
                onChange={(v) => update("notes", v)}
                placeholder="Uma pose específica, uma cor, o nome que vai na base, embalagem de presente, prazo apertado…"
                hint="Se a peça tem algum detalhe do seu jeito, conte aqui antes da produção começar"
                multiline
              />
            </div>
          )}

          {/* ---------------------------------------------------- Passo 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-white">
                Como você quer pagar
              </h2>

              <div className="grid gap-3">
                {[
                  {
                    id: "pix" as const,
                    title: "Pix",
                    body: `${site.descontoPix}% de desconto · aprovação na hora`,
                    // O mesmo abatimento que o banco vai fazer: sobre a
                    // mercadoria, sem o frete. Antes esta linha tirava 5%
                    // do total inteiro — e nem isso era cobrado de verdade.
                    badge: brl(Math.max(0, total - abatePix)),
                  },
                  {
                    id: "cartao" as const,
                    title: "Cartão de crédito",
                    body: "Em até 12x sem juros",
                    badge: `12x ${brl(total / 12)}`,
                  },
                  {
                    id: "boleto" as const,
                    title: "Boleto bancário",
                    body: "Compensação em até 2 dias úteis",
                    badge: brl(total),
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={cx(
                      "flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-300",
                      payment === option.id
                        ? "border-cyan-400 bg-cyan-400/8"
                        : "border-white/10 hover:border-white/25",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === option.id}
                      onChange={() => setPayment(option.id)}
                      className="sr-only"
                    />
                    <span
                      className={cx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        payment === option.id
                          ? "border-cyan-400"
                          : "border-white/25",
                      )}
                    >
                      {payment === option.id && (
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">
                        {option.title}
                      </span>
                      <span className="block text-xs text-silver-400">
                        {option.body}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-sm font-bold text-cyan-400 tabular-nums">
                      {option.badge}
                    </span>
                  </label>
                ))}
              </div>

              {/* O que acontece depois de finalizar.

                  Aqui morava um bloco de andaime do modelo: dizia "aqui
                  aparece o QR Code gerado pelo gateway" e "Ponto de
                  integração: placeOrder() em CheckoutClient.tsx", com nomes
                  de gateways que esta loja não usa. Isso ficou no ar para o
                  cliente ler bem na hora de pagar — prometia um QR Code que
                  nunca aparece nesta tela e deixava a loja com cara de
                  inacabada no pior momento possível. */}
              <div className="rounded-xl border border-dashed border-white/15 bg-white/2 p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                  </svg>
                  Como o pagamento acontece
                </p>
                <p className="mt-2 text-sm leading-relaxed text-silver-400">
                  {payment === "pix" &&
                    `Ao finalizar, você vai para a página segura do Asaas com o QR Code do Pix e o código para copiar. O desconto de ${site.descontoPix}% já vem aplicado.`}
                  {payment === "cartao" &&
                    "Ao finalizar, você vai para a página segura do Asaas para digitar o cartão. Os dados do cartão não passam pelo nosso site em momento nenhum."}
                  {payment === "boleto" &&
                    "Ao finalizar, você vai para a página segura do Asaas com o boleto e o código de barras para copiar."}
                </p>
                <p className="mt-3 text-xs text-muted">
                  O link também chega no seu e-mail — se fechar a página sem
                  pagar, dá para voltar por lá.
                </p>
              </div>

              {/* O Asaas não emite cobrança abaixo de um valor mínimo. Dizer
                  isso antes evita o cliente finalizar e ficar sem link. */}
              {totalCobrado > 0 && totalCobrado < site.valorMinimoCobranca && (
                <p className="rounded-xl border border-white/12 bg-white/4 px-4 py-3 text-sm text-silver-200">
                  Pedidos abaixo de{" "}
                  <strong className="text-white">
                    {brl(site.valorMinimoCobranca)}
                  </strong>{" "}
                  não geram cobrança online. Pode finalizar normalmente — a
                  gente combina o pagamento com você pelo WhatsApp.
                </p>
              )}

              <label className="flex cursor-pointer items-start gap-3 text-xs text-silver-400">
                <input type="checkbox" required className="mt-0.5 accent-cyan-400" />
                <span>
                  Li e aceito os{" "}
                  <Link
                    href="/termos"
                    target="_blank"
                    className="text-cyan-400 underline-offset-2 hover:underline"
                  >
                    termos de compra
                  </Link>{" "}
                  e a{" "}
                  <Link
                    href="/privacidade"
                    target="_blank"
                    className="text-cyan-400 underline-offset-2 hover:underline"
                  >
                    política de privacidade
                  </Link>{" "}
                  da Moldarte 3D. Entendo que peças personalizadas entram em
                  produção após a aprovação da prévia.
                </span>
              </label>
            </div>
          )}

          {/* Navegação */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/8 pt-6 sm:flex-row sm:justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-silver-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Voltar
              </button>
            ) : (
              <Link
                href="/carrinho"
                className="rounded-full border border-white/12 px-6 py-3 text-center text-sm font-medium text-silver-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Voltar ao carrinho
              </Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep((s) => (s + 1) as Step)}
                className={cx(
                  "rounded-full px-8 py-3 font-semibold transition-all duration-300",
                  canAdvance
                    ? "bg-white text-ink hover:bg-cyan-300 hover:shadow-glow"
                    : "cursor-not-allowed bg-white/8 text-muted",
                )}
              >
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                disabled={enviando}
                className={cx(
                  "rounded-full px-8 py-3 font-semibold transition-all duration-300",
                  enviando
                    ? "cursor-wait bg-white/8 text-muted"
                    : "bg-white text-ink hover:bg-cyan-300 hover:shadow-glow",
                )}
              >
                {enviando ? "Registrando seu pedido…" : "Confirmar pedido"}
              </button>
            )}
          </div>
        </div>
      </form>

      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <OrderSummary compact pagamento={payment} />
      </aside>
    </div>
  );
}
