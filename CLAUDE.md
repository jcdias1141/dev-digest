# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start        # serve o build de produção
```

Não há test runner nem linter configurados no projeto.

## Arquitetura

Blog estático em Next.js 16 (App Router, JavaScript puro — sem TypeScript) que
publica digests semanais escritos em markdown, e serve como índice navegável
das novidades dentro deles.

Fluxo: arquivo `.md` em `content/` → `lib/posts.js` → páginas.

**`lib/posts.js`** é a única camada de dados. Lê `content/` do disco com `fs` em
tempo de build/render de servidor e faz o parse do frontmatter com `gray-matter`.
Não existe banco, CMS nem API — para adicionar um digest basta criar o arquivo.

**Duas camadas de conteúdo**, e confundi-las é o erro mais fácil de cometer:

- **Edição** (`/post/2026-08-03`) — um arquivo `.md`, o digest da semana
- **Novidade** (`/novidade/<slug>`) — um `item` do frontmatter, com página própria

Um arquivo `.md` gera **uma** página de edição e **N** páginas de novidade.

Funções:

- `getAllPosts()` — edições, mais recente primeiro. Cada uma carrega `items` já
  normalizados e um `searchText` (título + tags + corpo markdown, sem acento).
- `getPost(slug)` / `getPostWithNeighbors(slug)` — a segunda devolve também
  `newer`/`older` para a navegação entre edições.
- `getAllItems()` — achata os `items` de todas as edições num array só, cada
  item com referência de volta (`postSlug`, `postTitle`, `date`) e o próprio
  `searchText`.
- `getItem(slug)` / `getItemWithNeighbors(slug)` — a segunda devolve `prev`/`next`
  **dentro da mesma edição**, para navegar entre as novidades da semana.
- `getCategories()` — categorias distintas com contagem. `"Claude Code"` é
  fixado em primeiro via `PINNED_CATEGORIES`; o resto por contagem desc e
  alfabética no empate.

O **slug da edição vem do nome do arquivo** (`2026-07-27.md` → `/post/2026-07-27`).
A convenção é `YYYY-MM-DD.md`.

O **slug da novidade vem do título**, atribuído por `assignItemSlugs()`. Ele roda
uma vez sobre todas as edições porque a unicidade é global, e percorre **do mais
antigo para o mais novo de propósito**: se uma edição futura repetir um título,
quem ganha o sufixo com a data é a nova, então URLs já publicadas nunca mudam.

**Páginas:**

- `app/page.js` — Server Component. Carrega os dados e passa para o browser;
  também renderiza o card "Esta semana" da edição mais recente.
- `app/DigestBrowser.js` — **o único componente client**. Recebe `items`,
  `categories` e `editions` já prontos via props, para que o `fs` continue
  rodando só no servidor. Faz busca, filtro por categoria e "carregar mais"
  (`PAGE_SIZE`, resetado sempre que o filtro muda).
- `app/post/[slug]/page.js` — a edição: "Nesta edição" (cards linkando para
  `/novidade/`) + corpo markdown + navegação anterior/seguinte.
- `app/novidade/[slug]/page.js` — a novidade: resumo como lead, `body` em
  markdown, link da fonte e navegação entre irmãs da mesma edição.
- `app/layout.js` — header sticky, `lang="pt-BR"`, container `max-w-5xl`.

`params` é assíncrono nas duas rotas dinâmicas (Next.js 16) — precisa de
`await params`.

**Cards clicáveis:** o título usa `after:absolute after:inset-0` para esticar a
área de clique por todo o card, com o `li` em `relative`. Links internos ao card
(a fonte externa) precisam de `relative z-10` para não serem engolidos.

## Formato do digest

`content/2026-07-27.md` é o arquivo-modelo; o `README.md` documenta o formato
completo e traz o trecho para o prompt de curadoria que gera os arquivos.

Regra que orienta o resto:

- `summary` — texto puro (2-3 frases), o card. Backticks apareceriam literais.
- `body` — markdown de verdade, o texto longo da página da novidade. Opcional.
- corpo do arquivo — só o que é da edição: `## Fixar o que li` e `## Retomando`.

**Não existe mais `## Destaque da semana` no corpo.** O aprofundamento de um
item vive no `body` dele; repetir no corpo colocaria o mesmo texto em duas
páginas.

`cover`/`coverAlt` são opcionais. Renderizados com `<img>` puro, **não com
`next/image`** — de propósito, para aceitar tanto caminho local quanto URL
externa sem precisar de `images.remotePatterns` nem de `dangerouslyAllowSVG`
no `next.config.js`.

## Busca

`lib/format.js` exporta `normalize()` (NFD + strip de diacríticos + minúsculo),
usado tanto para gerar slug de categoria quanto para pré-computar `searchText`
no servidor. É por isso que "sessao" acha "sessão". A query é dividida em
termos e todos precisam casar (AND).

## Estilo

Tailwind 3 + `@tailwindcss/typography`, **dark-only** — cores hardcoded, sem
prefixos `dark:` nem toggle. Paleta: fundo `neutral-950`, superfície
`neutral-900` com borda `neutral-800`, texto `neutral-200`, secundário
`neutral-400`/`neutral-500`, acento `emerald-400`.

Tipografia: uma única família em todo o site, via `theme.extend.fontFamily.sans`
no `tailwind.config.js`.

A fonte pretendida é a **Söhne**, mas ela é licenciada (Klim Type Foundry) e não
vai no repositório. Ela está em primeiro no stack para valer automaticamente se
os `.woff2` forem colocados em `public/fonts/` e o bloco `@font-face` no topo de
`app/globals.css` for descomentado. Quem renderiza hoje é a **Inter** —
substituta livre, também neo-grotesca — carregada por `next/font/google` em
`app/layout.js` e exposta como `var(--font-sans)`. O `next/font` baixa no build
e serve do próprio domínio, então não há request a CDN em runtime.

Escala fixa: título de card 24px / parágrafo de card 16px; título da página de
leitura 42px / corpo 18px. O corpo precisa de `prose-p:` e `prose-li:`
explícitos — o typography não herda o `text-[18px]` do container.

`app/globals.css` guarda só o que o typography não cobre: `::selection`,
`focus-visible` (o outline padrão some no escuro), `scroll-margin-top` nos `h2`
por causa do header sticky, estilo do `<summary>` e a remoção das backticks que
o plugin injeta em volta do `code` inline.

## Pegadinhas

- **Datas precisam de `timeZone: "UTC"`.** O YAML parseia `2026-07-27` como
  `Date` em UTC meia-noite; sem isso o formatador converte para UTC-3 e mostra
  26 de julho. Já tratado em `lib/format.js`.
- **`rehype-raw` é obrigatório** em `app/post/[slug]/page.js`. O `<details>` do
  gabarito é HTML bruto dentro do markdown, e o `react-markdown` v9 o imprime
  como texto literal sem esse plugin.
