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

A logo é a única arte da marca no site, em duas versões geradas a partir da
arte original (1402×1122):

| Arquivo | O que é | Onde aparece |
|---|---|---|
| `public/logo.png` | emblema quadrado 800×800 (lobo + anel) | cabeçalho, rodapé, destaque da home, preloader |
| `public/logo-full.png` | arte completa, com wordmark e fumaça | miniatura ao compartilhar o link (WhatsApp, Instagram, Facebook) |
| `src/app/icon.png` | emblema 512×512 | ícone da aba do navegador |
| `src/app/apple-icon.png` | emblema 180×180 | ícone do atalho no iPhone |

O emblema é quadrado porque o cabeçalho precisa de um selo compacto — e o
"MOLDARTE 3D" ali do lado é texto de verdade, que continua legível em qualquer
tamanho. A arte completa fica reservada para a prévia de compartilhamento, onde
o formato deitado é o certo.

**Para trocar a logo no futuro:** substitua os quatro arquivos mantendo as
proporções (os três primeiros quadrados, o `logo-full` deitado). Nenhum código
precisa mudar.

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

### 4. Produtos — vêm do Precifica 3D

**Você não cadastra produto aqui.** A loja lê o que você publica no Precifica
3D: precifica a peça, marca **“Publicar na loja”**, e ela aparece no site em
até um minuto — sem mexer em código nem refazer o deploy.

**Para ligar os dois, siga o [LIGAR-PRECIFICA.md](LIGAR-PRECIFICA.md)** — são
11 passos, com verificação em cada etapa e o que fazer quando algo falha.

Em resumo: rodar o `supabase-loja.sql` no Supabase, cadastrar três variáveis
na Vercel e refazer o deploy.

O que atravessa a ponte: nome, descrição, categoria, preço, tamanhos, foto,
prazo de produção e estoque. Peça marcada como **“Sob consulta”** entra na
loja sem botão de compra — no lugar dele vai um “Pedir orçamento”.

As **categorias da loja são as do Precifica**. Criou “Marvel” lá, a vitrine
passa a ter Marvel. Uma fonte de verdade só.

> **Enquanto o Supabase não estiver configurado**, o site mostra o catálogo de
> demonstração de `src/data/products.ts`, para não ficar uma vitrine vazia. Se
> estiver configurado e não houver nada publicado, ele mostra “nenhum produto”
> — nunca peça inventada no lugar de peça real.

### 4b. O catálogo de demonstração

Fica em **`src/data/products.ts`**. Serve só para desenvolvimento. Os campos:

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
| Catálogo | `src/lib/supabase.ts` | ✅ ligado ao Precifica 3D |
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

O endereço do site se resolve sozinho: na Vercel ele usa o domínio gerado
(`algo.vercel.app`) sem você configurar nada. **Quando o domínio próprio
entrar no ar**, crie a variável de ambiente no painel da Vercel:

```
NEXT_PUBLIC_SITE_URL=https://moldarte3d.com.br
```

É esse endereço que alimenta o sitemap e as URLs da miniatura de
compartilhamento.
