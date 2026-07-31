# Dev Digest

Blog local que lê seus digests semanais de `content/` e publica como páginas.

## Rodar

    npm install
    npm run dev

Abre em http://localhost:3000

## Como funciona

- Cada digest é um arquivo `.md` em `content/` (ex: `2026-08-04.md`)
- O nome do arquivo vira a URL (`/post/2026-08-04`), então use `YYYY-MM-DD.md`
- O frontmatter define título, data, tags e a lista de `items` — as novidades
  daquela semana
- A home indexa os `items` de todas as edições: busca por texto, filtro por
  categoria na lateral e "carregar mais"
- Cada post renderiza "Nesta edição" (os items com link da fonte), o markdown
  do corpo e navegação para a edição anterior/seguinte

## Formato do digest

```yaml
---
title: "Digest — 04 de agosto"
date: 2026-08-04
tags: ["claude-code", "cursor", "nextjs"]
cover: "/images/2026-08-04.png"
coverAlt: "Descrição da imagem para leitores de tela"
items:
  - title: "Subagentes paralelos no Claude Code"
    category: "Claude Code"
    summary: >-
      Resumo curto em texto puro (não é markdown).
    source: "https://code.claude.com/docs/en/changelog"
---

## Destaque da semana: …
## Fixar o que li
## Retomando
```

Divisão de responsabilidade:

- **`items`** — as novidades em si. É o que a home indexa, agrupa e busca.
  `summary` é **texto puro**: backticks e `**negrito**` apareceriam literais.
  `category` e `source` são opcionais (sem categoria, cai em "Outras novidades").
- **corpo markdown** — o que não é item: `## Destaque da semana` (análise mais
  longa), `## Fixar o que li` (perguntas + gabarito em `<details>`) e
  `## Retomando`.

Categorias são strings livres. `"Claude Code"` sempre aparece primeiro na
lateral; as demais vêm por volume de itens e depois em ordem alfabética.

## Imagem de capa

`cover` é opcional — sem ele, a edição simplesmente não mostra imagem. Aceita
caminho de arquivo em `public/` (ex: `/images/2026-08-04.jpg`) ou URL externa.
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

> Ao final, gere o arquivo markdown com este frontmatter, uma entrada em
> `items` para cada novidade do digest:
>
> ```yaml
> ---
> title: "Digest — <data por extenso>"
> date: <YYYY-MM-DD>
> tags: [<slugs das ferramentas citadas>]
> items:
>   - title: "<título curto da novidade>"
>     category: "<Claude Code | Outras ferramentas | Modelos | Frameworks>"
>     summary: >-
>       <2-3 frases em texto puro, sem markdown>
>     source: "<url da fonte, se houver>"
> ---
> ```
