# Ligar o Precifica 3D na loja — passo a passo

Guia único, do zero até a primeira peça aparecendo no site. São **11 passos**,
divididos em três partes. Faça na ordem: cada parte depende da anterior.

Ao final, publicar uma peça vai ser assim: calcula no Precifica → clica em
**Publicar na loja** → a peça aparece no site em até um minuto.

---

## Antes de começar

Tenha aberto em abas separadas:

- O painel do **Supabase** (<https://supabase.com/dashboard>)
- O painel da **Vercel** (<https://vercel.com/dashboard>)
- O **Precifica 3D**

E tenha à mão a pasta do Precifica, onde estão os dois arquivos `.sql`.

> ⚠️ **Uma regra que não pode ser quebrada:** o Supabase te dá duas chaves. A
> `anon` (também chamada de *public*) pode ir para o site e para o Precifica —
> ela sozinha não abre nada, porque quem decide o que é visível são as regras
> do banco. A `service_role` **nunca** pode sair do seu computador: ela ignora
> todas as regras e daria acesso total ao banco, incluindo pedidos e clientes.
> Se em algum momento você estiver em dúvida sobre qual é qual, pare e me
> pergunte.

---

## Parte 1 · No Supabase (só uma vez)

### Passo 1 — Criar a estrutura do banco

*Pule este passo se o Precifica já sincroniza na nuvem hoje.*

No menu da esquerda, **SQL Editor** → **New query**. Abra o arquivo
`supabase-schema.sql` da pasta do Precifica, copie tudo, cole e clique em
**Run**.

### Passo 2 — Abrir a vitrine

Ainda no **SQL Editor** → **New query**. Agora com o arquivo
`supabase-loja.sql`. Cole tudo e **Run**.

Este é o passo que libera a leitura pública **apenas** dos produtos publicados
e cria o espaço das fotos. Sem ele, o site não enxerga nada.

### Passo 2b — Pedidos e controle de estoque

Nova query com o arquivo **`supabase-estoque.sql`**. Cole e **Run**.

Ele cria a tabela de pedidos da loja e o extrato de estoque, com a reserva de
24 horas. Sem ele o site continua funcionando como vitrine, mas o checkout não
registra pedido e o estoque não baixa sozinho.

### Passo 2c — O resto, na ordem

Mais três arquivos, um por query, **nesta ordem** — cada um depende do
anterior:

| Arquivo | O que liga | Se pular |
|---|---|---|
| `supabase-pagamento.sql` | guarda a cobrança do Asaas no pedido | o pagamento não é confirmado sozinho |
| `supabase-cupons.sql` | cupons de desconto e o cálculo do frete no banco | cupom nenhum funciona no checkout |
| `supabase-orcamentos.sql` | pedidos de orçamento, contato e novidades | os três formulários do site dão erro ao enviar |

O `supabase-cupons.sql` troca a função `criar_pedido` por uma versão que já
conhece frete e desconto. Rodar ele antes do `supabase-estoque.sql` faria a
versão antiga sobrescrever a nova — daí a ordem importar.

Depois vêm os arquivos que corrigem essa mesma função, e por isso são sempre
os últimos, nesta ordem:

| Arquivo | O que corrige | Se pular |
|---|---|---|
| `supabase-preco.sql` | faixa de uma unidade deixa de mudar o preço | o site mostra um valor e o Asaas cobra outro |
| `supabase-pix.sql` | o desconto de 5% no Pix passa a existir de verdade | o site anuncia o desconto e a cobrança vem cheia |
| `supabase-clientes.sql` | a aba Clientes e o cupom no nome de uma pessoa | a aba fica vazia e cupom pessoal não é aceito |
| `supabase-frete-peso.sql` | o frete passa a variar por peso, não só por região | todo pedido sai com o frete antigo, único por região |

À parte da fila acima, e sem briga com ela, existe o **`supabase-brindes.sql`**:
ele só acrescenta três colunas de empresa aos pedidos de orçamento, para a
página `/brindes` guardar razão social, CNPJ e de onde o pedido veio. Pode
rodar a qualquer momento depois do `supabase-orcamentos.sql`. Sem ele o
pedido de empresa continua chegando, só que com esses dados no texto da
descrição em vez de em coluna própria.

Os dois recriam a `criar_pedido`. Rodar fora de ordem faz uma versão antiga
apagar a correção da outra, e o sintoma volta sem nada ter mudado no código.

### Passo 3 — Conferir se funcionou

Nova query, cole e rode:

```sql
select policyname from pg_policies where tablename = 'dados';
select id, public from storage.buckets where id = 'loja';
```

O resultado tem que mostrar uma política chamada **`loja e publica`** e um
balde **`loja`** com `public = true`.

Para conferir tudo de uma vez, incluindo o que veio depois:

```sql
select 'tabela pedidos'    as item, count(*)::text as resultado from information_schema.tables where table_name = 'pedidos_loja'
union all select 'tabela cupons',     count(*)::text from information_schema.tables where table_name = 'cupons'
union all select 'tabela orcamentos', count(*)::text from information_schema.tables where table_name = 'orcamentos_loja'
union all select 'tabela mensagens',  count(*)::text from information_schema.tables where table_name = 'mensagens_loja'
union all select 'balde loja publico',    coalesce((select public::text       from storage.buckets where id = 'loja'), 'NAO EXISTE')
union all select 'balde orcamentos privado', coalesce((select (not public)::text from storage.buckets where id = 'orcamentos'), 'NAO EXISTE');
```

Todos têm que voltar `1` ou `true`. Qualquer `0` ou `NAO EXISTE` aponta
exatamente qual arquivo do Passo 2 ficou para trás.

### Passo 4 — Copiar as duas credenciais

Vá em **Project Settings** (a engrenagem) → **API**. Copie e guarde:

| O que copiar | Onde está |
|---|---|
| **Project URL** | algo como `https://abcdefgh.supabase.co` |
| **anon public** | uma chave longa começando com `eyJ...` |

### Passo 5 — Descobrir o seu identificador

Nova query no SQL Editor:

```sql
select id, email from auth.users;
```

Copie o `id` da linha com o **seu** e-mail. É um código no formato
`8f3c1a2b-...`. Guarde junto com as credenciais do passo 4.

---

## Parte 2 · No Precifica

### Passo 6 — Conectar na nuvem

*Pule se o Precifica já sincroniza hoje.*

Abra o Precifica, clique em **Nuvem** no topo. Preencha a **URL do projeto** e
a **Chave pública (anon)** do passo 4, faça login com seu e-mail e senha.

A luzinha do botão **Nuvem** fica verde quando está sincronizando.

### Passo 7 — Publicar uma peça de teste

Duas formas, use a que preferir:

- **Pela calculadora:** preencha os dados da peça, dê um nome a ela e clique
  em **Publicar na loja** no topo. Escolha a categoria e confirme.
- **Pelo catálogo:** aba **Catálogo**, marque a caixa **Publicar na loja** no
  produto que quiser.

Espere a luz da nuvem indicar que sincronizou (leva alguns segundos).

### Passo 8 — Conferir se a peça chegou no banco

De volta ao Supabase, **SQL Editor**, nova query:

```sql
select * from public.vitrine;
```

A peça publicada tem que aparecer aí, com nome, categoria e preço. **Se
aparecer aqui, o Precifica cumpriu a parte dele.**

---

## Parte 3 · Na Vercel

### Passo 9 — Cadastrar as variáveis

No painel da Vercel, abra o projeto **mold-arte** → **Settings** →
**Environment Variables**. Crie estas três, marcando todos os ambientes
(*Production*, *Preview* e *Development*):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | a Project URL do passo 4 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave anon do passo 4 |
| `NEXT_PUBLIC_SUPABASE_OWNER` | o seu id do passo 5 |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave **service_role**, da mesma tela do passo 4 |

> ⚠️ A última **não tem** o prefixo `NEXT_PUBLIC_`, e isso é proposital. Ela
> ignora todas as regras do banco e só pode existir no servidor. Cadastre
> exatamente com esse nome; se ganhar o prefixo, ela vaza para o navegador de
> qualquer visitante.

### Passo 10 — Refazer o deploy

**Este passo é obrigatório e é o que mais gente esquece.** Variáveis só entram
no site num build novo — cadastrar não basta.

Vá em **Deployments**, no deploy mais recente clique nos três pontinhos (`⋯`)
→ **Redeploy** → confirme.

### Passo 11 — Ver a peça no site

Quando o deploy terminar, abra a loja. A peça de teste tem que estar lá, com o
preço terminando em `,90` e a tabela de desconto por quantidade na página dela.

**Deu certo? Está ligado.** A partir de agora é só publicar pelo Precifica.

---

## Se alguma coisa não funcionar

Abra o site, aperte `F12` → aba **Console**. As mensagens de erro que eu deixei
apontam direto para a causa.

| O que acontece | Causa mais provável | O que fazer |
|---|---|---|
| A loja mostra peças que você nunca cadastrou (vaso, dragão, luminária) | O site não achou as variáveis e caiu no catálogo de demonstração | Refaça o passo 10 — quase sempre é o redeploy que faltou |
| A loja diz "nenhum produto" | Conectou certo, mas não há nada publicado | Confira o passo 8: se a peça não aparece lá, o problema é no Precifica |
| No console aparece `401` ou `403` | O `supabase-loja.sql` não foi rodado | Refaça os passos 2 e 3 |
| A peça aparece sem foto | O envio da foto falhou | Veja o console do **Precifica** (`F12`). Confirme o balde `loja` no passo 3 |
| Publiquei e não mudou nada no site | O site guarda a lista por até 1 minuto | Espere um minuto e recarregue |

### Testar a leitura pública sem depender do site

Cole no navegador, trocando as duas partes em maiúsculas:

```
https://SEU-PROJETO.supabase.co/rest/v1/dados?select=id&colecao=eq.loja&apikey=SUA-CHAVE-ANON
```

- Voltou uma lista (mesmo vazia, `[]`) → a regra de leitura pública está certa.
- Voltou erro de permissão → falta rodar o `supabase-loja.sql`.

---

---

# Ligar o controle automático de estoque

São duas tarefas independentes. Faça as duas — uma sem a outra não funciona.

---

## Tarefa A · Criar as tabelas de pedido e estoque

**Onde:** painel do Supabase. **Tempo:** 2 minutos.

### A1. Abrir o arquivo

O arquivo é o **`supabase-estoque.sql`**, e ele está na pasta do Precifica:

```
C:\Users\computador\Desktop\Precificação de impressoes\supabase-estoque.sql
```

Se preferir pelo navegador, ele também está no GitHub, no repositório
`Precificacao`. Abra, clique no botão de copiar e pegue o conteúdo inteiro.

### A2. Colar no SQL Editor

No Supabase, menu da esquerda → **SQL Editor** → botão **New query**.

Apague o que estiver na caixa, cole o arquivo inteiro e clique em **Run**
(ou `Ctrl+Enter`).

Deve aparecer **Success. No rows returned**. É o esperado: o arquivo cria
coisas, não devolve lista.

> Se der erro dizendo que `dados` não existe, você pulou o `supabase-schema.sql`
> lá do começo deste guia. Rode ele primeiro e volte aqui.

### A3. Conferir que criou

Nova query, cole e rode:

```sql
select tablename from pg_tables
where schemaname = 'public' and tablename in ('pedidos_loja','estoque_movimento');

select routine_name from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('criar_pedido','cancelar_pedido','expirar_reservas','estoque_disponivel');
```

A primeira consulta tem que listar **2 tabelas**. A segunda, **4 funções**. Se
faltar alguma, rode o arquivo de novo — ele foi escrito para poder ser
executado mais de uma vez sem estragar nada.

### A4. Ver o estoque atual

```sql
select * from public.estoque_disponivel(auth.uid());
```

Aqui aparecem os seus produtos publicados com a quantidade de cada um. É a
mesma conta que a loja usa. Se vier vazio, você ainda não publicou nada.

---

## Tarefa B · Dar ao site permissão de gravar pedido

**Onde:** Supabase e Vercel. **Tempo:** 3 minutos.

> ⚠️ **Leia antes de começar.** Esta tarefa envolve a chave mais poderosa do
> seu banco. Ela ignora todas as regras de segurança: quem tiver ela lê, muda e
> apaga tudo, inclusive pedidos e dados de clientes. Ela vai para um lugar só —
> as variáveis da Vercel — e nunca para dentro de código, mensagem ou print.
> Se em qualquer momento você ficar em dúvida, pare e me pergunte.

### B1. Copiar a chave

No Supabase: **Project Settings** (a engrenagem) → **API**.

Role até **Project API keys**. Ali existem duas. Você já usou a de cima; agora
é a **outra**:

| Chave | Para que serve | Onde vai |
|---|---|---|
| `anon` / `public` | leitura da vitrine | já está cadastrada |
| **`service_role` / `secret`** | **gravar pedido** | **é esta agora** |

Ela vem escondida atrás de um botão **Reveal**. Clique nele e depois no botão
de copiar. Ela é longa, como a outra.

### B2. Cadastrar na Vercel

Painel da Vercel → projeto **mold-arte** → **Settings** →
**Environment Variables** → **Add New**.

| Campo | O que preencher |
|---|---|
| **Key** (nome) | `SUPABASE_SERVICE_ROLE_KEY` |
| **Value** (valor) | a chave que você copiou |
| **Environments** | marque **Production**, **Preview** e **Development** |

Clique em **Save**.

> **O nome precisa ser exatamente esse.** Repare que ele **não** começa com
> `NEXT_PUBLIC_`, diferente das outras três variáveis. Isso não é descuido: tudo
> que tem esse prefixo é embutido no site e fica visível para qualquer visitante.
> Se você acrescentar o prefixo por engano, essa chave vaza para o mundo.
>
> Se isso acontecer, dá para consertar: no Supabase, em Project Settings → API,
> existe a opção de gerar chaves novas, o que invalida a antiga na hora.

### B3. Refazer o deploy

Variável nova só entra num build novo. Cadastrar não basta.

**Deployments** → nos três pontinhos (`⋯`) do deploy mais recente →
**Redeploy** → confirmar.

Espere terminar (1 a 2 minutos).

---

## Testar de ponta a ponta

Agora vale conferir se as duas tarefas funcionaram juntas.

1. **No Precifica**, escolha uma peça publicada e coloque **estoque 3**.
   Sincronize e espere a luz da nuvem confirmar.
2. **Na loja**, abra a peça. Deve aparecer o aviso de últimas unidades.
3. **Compre 1**, preenchendo o checkout até o fim.
4. Você deve ver a tela de **pedido recebido**, com o número e o aviso da
   reserva de 24 horas.
5. **Recarregue a página do produto.** O estoque agora tem que ser **2**.
6. **No Precifica**, sincronize e abra **Pedidos e painel**. O pedido tem que
   estar lá, com o nome do cliente, marcado com **· loja** e com o lucro em
   amarelo com asterisco (custo de produção ainda não lançado).
7. Mude o status para **Cancelado** e sincronize.
8. **Recarregue a loja.** O estoque voltou para **3**.

Se os oito passos funcionarem, está tudo ligado.

### Conferências úteis no Supabase

```sql
-- pedidos que chegaram
select id, status, total, criado_em, expira_em from public.pedidos_loja
order by criado_em desc;

-- o extrato: cada saída e cada volta de peça
select slug, delta, motivo, pedido_id, criado_em
from public.estoque_movimento order by criado_em desc limit 20;

-- forçar a devolução de reservas vencidas, sem esperar um novo pedido
select public.expirar_reservas(auth.uid());
```

### Se algo não funcionar

| O que acontece | Causa provável | O que fazer |
|---|---|---|
| "A loja está sem conexão com o sistema de pedidos" | A variável da Tarefa B não chegou | Confira o nome exato e refaça o deploy (B3) |
| "Não consegui registrar seu pedido agora" | As tabelas da Tarefa A não existem | Refaça a Tarefa A e confira no passo A3 |
| O estoque não baixa depois da compra | O pedido não chegou a ser criado | Veja se ele aparece em `pedidos_loja` |
| O pedido não aparece no Precifica | Ainda não sincronizou | Clique em **Sincronizar agora** na Nuvem |
| A peça sumiu da loja sozinha | O estoque chegou a zero | É o comportamento certo — reponha no Precifica |

---

---

# Ligar o pagamento (Asaas)

O cliente paga numa página do próprio Asaas — **dado de cartão nunca passa
pelo seu site**, e a obrigação de proteger esse dado fica com quem tem
certificação para isso.

## 1. Preparar o banco

No SQL Editor do Supabase, rode o arquivo **`supabase-pagamento.sql`** (está na
pasta do Precifica). Ele adiciona ao pedido os campos que guardam qual cobrança
é a dele.

## 2. Pegar a chave no Asaas

Painel do Asaas → **Integrações** → **Chave de API** → gerar. Copie.

> Comece pelo **sandbox**, que é o ambiente de testes com dinheiro de mentira.
> A chave do sandbox e a de produção são **diferentes** — trocar de ambiente
> exige trocar a chave também.

## 3. Cadastrar o webhook

Ainda no Asaas → **Integrações** → **Webhooks** → **Adicionar**:

| Campo | Valor |
|---|---|
| URL | `https://mold-arte.vercel.app/api/pagamento/webhook` |
| Token de autenticação | invente um texto e **guarde** |
| Eventos | os de **cobrança** (pagamento recebido, confirmado, estornado) |

É esse aviso que faz o pedido virar "pago" sozinho. Sem ele, o pagamento entra
na sua conta mas o site não fica sabendo.

## 4. Cadastrar na Vercel

**Settings** → **Environment Variables**:

| Nome | Valor |
|---|---|
| `ASAAS_API_KEY` | a chave do passo 2 |
| `ASAAS_AMBIENTE` | `sandbox` agora, `producao` depois |
| `ASAAS_WEBHOOK_TOKEN` | o mesmo texto do passo 3 |

Depois **Redeploy**.

## 5. Testar no sandbox

Faça uma compra no site. Você deve ser levado para a página do Asaas, e o
pedido aparecer no painel de sandbox deles. Pague por lá com os dados de teste
e confira no Supabase:

```sql
select id, status, pago_em, pagamento_id from public.pedidos_loja
order by criado_em desc limit 5;
```

O status tem que virar `pago` sozinho, em segundos.

## 6. Virar a chave para produção

Trocou `ASAAS_AMBIENTE` para `producao`, trocou `ASAAS_API_KEY` pela chave de
produção, refez o deploy e cadastrou o webhook também na conta de produção?
Então está vendendo.

> **Taxas.** O Asaas cobra por transação, e o valor muda conforme o meio de
> pagamento. Lance isso como custo no Precifica, senão sua margem calculada
> fica maior do que a real.

---

# Fazer a loja atualizar na hora

Por padrão a loja guarda a lista de produtos por até **30 segundos** antes de
perguntar de novo ao banco. Essa espera existe para não gerar uma consulta a
cada visitante — mas é ela que faz você publicar e ficar olhando para o preço
antigo.

Dá para inverter: em vez de a loja ficar perguntando, o **Precifica avisa**
quando algo muda.

### 1. Inventar uma chave

Qualquer texto serve, desde que seja difícil de adivinhar. Por exemplo:
`moldarte-aviso-7c2f91`.

### 2. Cadastrar na Vercel

**Settings** → **Environment Variables** → **Add New**:

| Campo | Valor |
|---|---|
| Key | `REVALIDATE_SECRET` |
| Value | a chave que você inventou |
| Environments | Production, Preview e Development |

Depois **Deployments** → `⋯` → **Redeploy**.

### 3. Cadastrar no Precifica

Abra **Nuvem** e preencha o bloco **"Avisar a loja na hora"**:

| Campo | Valor |
|---|---|
| Endereço da loja | `https://mold-arte.vercel.app` |
| Chave de atualização | a **mesma** chave |

Pronto. A partir daí, toda vez que você sincronizar algo que mexa na vitrine,
a loja é avisada e a mudança aparece em segundos.

### Conferir

Cole no navegador, trocando pela sua chave:

```
https://mold-arte.vercel.app/api/revalidar?chave=SUA-CHAVE
```

- `{"ok":true,...}` → está funcionando
- `{"ok":false,"recado":"chave inválida"}` → a chave daqui é diferente da da Vercel
- Erro dizendo que falta `REVALIDATE_SECRET` → faltou o passo 2, ou o redeploy

> Se você não configurar nada disso, **não quebra**: a loja continua se
> atualizando sozinha em até 30 segundos. Isto só encurta a espera.

---

---

# Quando o domínio próprio entrar no ar

Cinco coisas mudam. Nenhuma é difícil, mas esquecer alguma dá problema difícil
de perceber.

### 1. Apontar o site para o domínio

Na Vercel: **Settings** → **Domains** → adicione o domínio e siga as
instruções de DNS do registrador.

Depois crie a variável de ambiente:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://3dmoldarte.com.br` |

É ela que alimenta o sitemap e a miniatura de compartilhamento. Sem isso, o
Google continua sendo mandado para o endereço `.vercel.app`.

**Refaça o deploy** depois de cadastrar.

### 2. Atualizar o webhook do Asaas

No painel do Asaas → **Integrações** → **Webhooks**, troque a URL para:

```
https://3dmoldarte.com.br/api/pagamento/webhook
```

> O endereço `.vercel.app` continua funcionando em paralelo, então o webhook
> antigo não quebra sozinho. **Mas quebra** se você configurar o `.vercel.app`
> para redirecionar ao domínio novo: aviso de pagamento é um POST, e
> redirecionamento em POST nem sempre é seguido. O pagamento cairia na conta
> sem o site ficar sabendo. Atualize e não dependa da sorte.

### 3. Verificar o domínio no Resend

É isto que **libera o e-mail para o cliente**. Enquanto não for feito, só você
recebe aviso de pedido.

No Resend → **Domains** → adicione o domínio e cadastre os registros DNS que
ele pedir. Depois crie na Vercel:

| Nome | Valor |
|---|---|
| `EMAIL_REMETENTE` | `Moldarte 3D <pedidos@3dmoldarte.com.br>` |

### 4. Avisar o Precifica do novo endereço

Em **Nuvem** → "Avisar a loja na hora", troque o campo *Endereço da loja* para
o domínio novo. Se ficar no antigo, a loja volta a demorar até 30 segundos
para mostrar o que você publica.

### 5. Trocar o e-mail de contato (opcional)

Se criar um e-mail no domínio, edite `email` em `src/lib/site.ts`. Ele aparece
no rodapé, no contato, no sobre e nas páginas legais — muda em todos de uma vez.

---

## Depois que estiver funcionando

- **Domínio próprio:** quando ele entrar no ar, crie na Vercel a variável
  `NEXT_PUBLIC_SITE_URL` com o endereço completo e refaça o deploy. É ela que
  alimenta o sitemap e a miniatura de compartilhamento.
- **Desconto por quantidade:** as faixas ficam nas configurações da
  calculadora. Mudou lá, vale para todos os produtos publicados no próximo
  sincronismo.
- **Tirar uma peça do ar:** desmarque **Publicar na loja**. Ela some do site na
  sincronização seguinte.
