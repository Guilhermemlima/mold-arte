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

### Passo 3 — Conferir se funcionou

Nova query, cole e rode:

```sql
select policyname from pg_policies where tablename = 'dados';
select id, public from storage.buckets where id = 'loja';
```

O resultado tem que mostrar uma política chamada **`loja e publica`** e um
balde **`loja`** com `public = true`. Se aparecer, a Parte 1 está pronta.

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

## Depois que estiver funcionando

- **Domínio próprio:** quando ele entrar no ar, crie na Vercel a variável
  `NEXT_PUBLIC_SITE_URL` com o endereço completo e refaça o deploy. É ela que
  alimenta o sitemap e a miniatura de compartilhamento.
- **Desconto por quantidade:** as faixas ficam nas configurações da
  calculadora. Mudou lá, vale para todos os produtos publicados no próximo
  sincronismo.
- **Tirar uma peça do ar:** desmarque **Publicar na loja**. Ela some do site na
  sincronização seguinte.
