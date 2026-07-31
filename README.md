# Dev Digest

Blog local que lê seus digests semanais de `content/` e publica como páginas.

## Rodar

    npm install
    npm run dev

Abre em http://localhost:3000

## Como funciona

- Cada digest é um arquivo `.md` em `content/` (ex: `2026-08-03.md`)
- O nome do arquivo vira a URL (`/post/2026-08-03`), então use `YYYY-MM-DD.md`
- O frontmatter define título, data, tags e a lista de `items` — as novidades
  daquela semana
- **Cada item vira uma página própria** em `/novidade/<slug-do-titulo>`
- A home indexa os `items` de todas as edições: busca por texto, filtro por
  categoria na lateral e "carregar mais". Clicar num card abre a página da
  novidade
- Cada post é o índice da semana: "Nesta edição" com os items, o corpo markdown
  e navegação para a edição anterior/seguinte

## Duas camadas

O blog tem dois tipos de página, e é importante não confundir:

| | URL | O que é |
|---|---|---|
| **Edição** | `/post/2026-08-03` | O digest da semana inteiro — índice dos items, perguntas e "Retomando" |
| **Novidade** | `/novidade/subagentes-paralelos-no-claude-code` | Uma novidade só, com texto longo e link da fonte |

Os items de uma edição continuam pertencendo a ela — cada página de novidade
linka de volta para o digest onde saiu, e navega entre as irmãs da mesma semana.

## Formato do digest

```yaml
---
title: "Digest — 03 de agosto"
date: 2026-08-03
tags: ["claude-code", "cursor", "nextjs"]
cover: "/images/2026-08-03.png"
coverAlt: "Descrição da imagem para leitores de tela"
items:
  - title: "Subagentes paralelos no Claude Code"
    category: "Claude Code"
    summary: >-
      Resumo curto em texto puro (não é markdown).
    source: "https://code.claude.com/docs/en/changelog"
    body: |
      Texto longo da página da novidade. Aqui **é** markdown:
      subtítulos, listas e blocos de código funcionam.

      ## Por que importa

      Dois ou três parágrafos explicando o impacto prático.
---

## Fixar o que li
## Retomando
```

Divisão de responsabilidade:

- **`summary`** — as 2-3 frases do card, na home e no índice da edição.
  É **texto puro**: backticks e `**negrito**` apareceriam literais.
- **`body`** — o texto longo da página da novidade. É **markdown de verdade**.
  Opcional; sem ele a página mostra só o resumo e o link da fonte.
- **corpo markdown do arquivo** — o que é da edição, não de um item:
  `## Fixar o que li` (perguntas + gabarito em `<details>`) e `## Retomando`.

Não repita: o aprofundamento de um item vai no `body` dele, não numa seção
`## Destaque da semana` no corpo. Senão o mesmo texto aparece em duas páginas.

`category` e `source` são opcionais (sem categoria, cai em "Outras novidades").

Categorias são strings livres. `"Claude Code"` sempre aparece primeiro na
lateral; as demais vêm por volume de itens e depois em ordem alfabética.

### Slug da novidade

Gerado do título, sem acento (`"Subagentes paralelos no Claude Code"` →
`subagentes-paralelos-no-claude-code`). Se uma edição futura repetir um título,
quem ganha sufixo com a data é a **nova** — as URLs antigas nunca mudam.

## Imagem de capa

`cover` é opcional — sem ele, a edição simplesmente não mostra imagem. Aceita
caminho de arquivo em `public/` (ex: `/images/2026-08-03.jpg`) ou URL externa.
Aparece grande no topo do post e como miniatura no card "Esta semana" da home,
sempre recortada em 16/9.

Sempre preencha `coverAlt` descrevendo a imagem. A miniatura da home usa
`alt=""` de propósito: ali ela é decorativa, e o título ao lado já diz tudo
para quem usa leitor de tela.

Use imagens largas — elas são recortadas em 16/9 e a capa do post chega a ~980px
de largura, então algo abaixo de 1200px de largura fica visivelmente mole.

Bancos gratuitos com licença para uso comercial: [Unsplash](https://unsplash.com),
[Pexels](https://pexels.com). Confira a licença antes de subir imagem de outra
origem — se o blog for publicado, ela fica pública junto.

## Automatizar

Faça sua tarefa de segunda escrever um arquivo novo em `content/` seguindo o
formato acima. O blog atualiza sozinho no próximo `npm run dev` / build.

O prompt de curadoria precisa emitir o bloco `items:` — sem ele a edição entra
no site, mas nenhuma novidade aparece no índice da home. Trecho pronto para
colar no prompt:

> Grave o digest em `content/<AAAA-MM-DD>.md`, onde a data é a **segunda-feira
> de hoje** (se hoje não for segunda, use a segunda mais recente). O nome do
> arquivo vira a URL, então não use outro dia da semana.
>
> O frontmatter precisa de uma entrada em `items` para cada novidade — sem
> isso a edição não aparece no índice da home:
>
> ```yaml
> ---
> title: "Digest — <data por extenso>"
> date: <AAAA-MM-DD, a mesma do nome do arquivo>
> tags: [<slugs das ferramentas citadas>]
> items:
>   - title: "<título curto da novidade>"
>     category: "<Claude Code | Outras ferramentas | Modelos | Frameworks>"
>     summary: >-
>       <2-3 frases em texto puro, sem markdown>
>     source: "<url da fonte, se houver>"
> ---
> ```
