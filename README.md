# Moldarte 3D — E-commerce

Loja completa em **Next.js 15 + React 19 + TypeScript + Tailwind v4 + GSAP**, com
identidade visual tirada da logo (navy profundo, azul-aço, ciano dos olhos do
lobo e prata).

---

## Como rodar

```bash
npm run dev
```

Abre em <http://localhost:3000>.

Para gerar a versão de produção:

```bash
npm run build
```

E para servir o build:

```bash
npm start
```

---

## As 5 coisas que você provavelmente quer mudar primeiro

### 1. Logo — ✅ já instalada

A logo original está em `public/logo.png` e aparece no cabeçalho, no rodapé, no
preloader e como ícone da aba do navegador (`src/app/icon.png` e
`src/app/apple-icon.png`, convenção do Next).

Para trocar por outra versão, basta substituir esses três arquivos — nenhum
código precisa mudar.

> **Vale melhorar:** o arquivo atual tem 158×159 px. Funciona bem no cabeçalho,
> mas fica um pouco macio no ícone do iPhone (180 px) e em telas retina grandes.
> Se você tiver a arte original em 512×512 ou maior, é só sobrescrever os
> mesmos três arquivos.

Existe também `public/logo-mark.svg`: uma versão vetorial só do lobo, com fundo
transparente, para quando a marca precisar aparecer sem o selo escuro. O lobo
animado da página inicial é uma ilustração vetorial inspirada nessa arte —
vetor porque ele aparece grande e precisa continuar nítido.

### 2. Telefone, e-mail e redes sociais

Tudo num arquivo só: **`src/lib/site.ts`**.

```ts
contact: {
  whatsapp: "5500000000000",      // só dígitos, com 55 na frente
  whatsappLabel: "(00) 00000-0000",
  email: "contato@moldarte3d.com.br",
},
```

Mudou aqui, mudou no site inteiro: cabeçalho, rodapé, botão flutuante do
WhatsApp, páginas de contato e SEO.

### 3. Regras de frete

Também em `src/lib/site.ts`:

```ts
shipping: {
  freeShippingFrom: 299,   // valor a partir do qual o frete é grátis
  flatRate: 24.9,          // frete fixo abaixo desse valor
},
```

### 4. Produtos

Estão em **`src/data/products.ts`**. Copie um bloco existente e ajuste. Os
campos que mais importam:

| Campo | Para que serve |
|---|---|
| `slug` | vira a URL: `/produto/vaso-onda-espiral` |
| `price` / `compareAtPrice` | preço atual e preço "de" (gera o selo de desconto) |
| `options` | variações; `priceDelta` soma no preço final |
| `images` | array de URLs das fotos — **deixe vazio para usar o visual gerado** |
| `leadTimeDays` | prazo de produção mostrado na peça |
| `featured` / `isNew` / `bestSeller` | selos e destaque na home |

> **Fotos:** enquanto `images` estiver vazio, o site desenha uma arte gerada a
> partir do slug (sempre igual para o mesmo produto, dentro da paleta da marca).
> É só preencher `images: ["/produtos/vaso-1.jpg"]` quando as fotos reais
> chegarem — nada mais precisa mudar.

Se um domínio de imagem externo for usado, libere-o em `next.config.ts` na
lista `remotePatterns`.

### 5. Cores da marca

Todas as cores são tokens no topo de `src/app/globals.css`, dentro do bloco
`@theme`. Mudou lá, mudou no site todo.

---

## Onde plugar o backend

O site está pronto para receber o sistema — todos os pontos de integração estão
marcados com `TODO` no código:

| O quê | Arquivo | Função |
|---|---|---|
| Catálogo (API/CMS/Supabase) | `src/data/products.ts` | `getAllProducts`, `getProductBySlug`, `getFeaturedProducts` |
| Pagamento | `src/components/checkout/CheckoutClient.tsx` | `placeOrder()` |
| Cupom de desconto | `src/components/checkout/OrderSummary.tsx` | `applyCoupon()` |
| Formulário de orçamento | `src/components/orcamento/QuoteForm.tsx` | `submit()` |
| Formulário de contato | `src/components/contato/ContactForm.tsx` | `submit()` |
| Newsletter | `src/components/Newsletter.tsx` | `submit()` |

As funções de catálogo já são `async` de propósito: basta trocar o corpo delas
por um `fetch()` que **nenhuma página precisa ser reescrita**.

### Sobre o pagamento

O checkout monta o pedido, valida os dados e mostra a tela de confirmação, mas
**não processa pagamento** — isso depende de contratar um gateway
(Mercado Pago, Pagar.me, Stripe, Asaas…).

Na etapa 3 há um bloco reservado para os campos do gateway. Importante: os
dados do cartão devem ir direto para o gateway pelos componentes seguros dele —
a loja nunca deve receber nem guardar número de cartão (é exigência de PCI-DSS).

O cupom de exemplo que funciona hoje é `MOLDARTE10` (10% off), só para você ver
a mecânica rodando.

---

## O que já está pronto

**Páginas**

- `/` — home com hero animado, categorias, destaques, processo, materiais, depoimentos e CTA
- `/loja` — catálogo com busca, filtro por categoria, faixa de preço, ordenação e filtros rápidos
- `/produto/[slug]` — galeria, variações com preço dinâmico, abas e produtos relacionados
- `/carrinho` — edição de quantidades e resumo
- `/checkout` — 3 etapas (identificação, entrega, pagamento) com busca de CEP
- `/orcamento` — envio de arquivo STL/OBJ com arrastar-e-soltar
- `/sobre`, `/contato` (com FAQ) e página 404 personalizada

**Recursos**

- Carrinho persistente no navegador (sobrevive a fechar a aba)
- Drawer lateral do carrinho com barra de progresso do frete grátis
- Busca por atalho `Ctrl/Cmd + K`
- Scroll suave (Lenis) sincronizado com o GSAP
- Animações de entrada por scroll, timeline horizontal fixada, contadores, cursor customizado, efeito ímã nos botões, cartões com inclinação 3D
- Preloader na primeira visita da sessão
- Preenchimento automático de endereço pelo CEP (ViaCEP)
- Botão flutuante de WhatsApp e sistema de avisos (toasts)
- SEO: metadados por página, Open Graph, `sitemap.xml`, `robots.txt` e dados estruturados de produto (rich snippets do Google)
- PWA básico (`manifest.webmanifest`) e favicon próprio
- Acessibilidade: navegação por teclado, foco visível, textos alternativos, link "pular para o conteúdo" e respeito a `prefers-reduced-motion`

---

## Estrutura

```
src/
├── app/                    páginas (App Router)
├── components/
│   ├── home/               seções da página inicial
│   ├── loja/               catálogo e filtros
│   ├── produto/            página de produto
│   ├── carrinho/           página do carrinho
│   ├── checkout/           fluxo de pagamento
│   ├── contato/ orcamento/ formulários
│   └── *.tsx               header, footer, animações, cartões
├── context/                carrinho e avisos (estado global)
├── data/products.ts        catálogo  ← trocar pelo backend
└── lib/site.ts             dados da marca  ← editar primeiro
```

---

## Publicar

O jeito mais simples é a [Vercel](https://vercel.com) (mesma empresa do
Next.js): suba o projeto num repositório Git, importe lá e o deploy sai
automático a cada commit. Funciona igual em Netlify, Railway ou qualquer VPS
com Node 18+.

Antes de publicar, troque `site.url` em `src/lib/site.ts` para o domínio real —
é ele que alimenta o sitemap e as tags de compartilhamento.
