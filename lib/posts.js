import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { normalize, slugify } from "./format";

const contentDir = path.join(process.cwd(), "content");

const FALLBACK_CATEGORY = "Outras novidades";

// Prioridade declarada do digest: Claude Code sempre primeiro.
const PINNED_CATEGORIES = ["Claude Code"];

export function getAllPosts() {
  if (!fs.existsSync(contentDir)) return [];

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
    const { data, content } = matter(raw);
    const tags = data.tags || [];

    return {
      slug,
      title: data.title || slug,
      date: data.date || slug,
      tags,
      // Capa opcional: caminho em /public (ex: /images/2026-08-04.svg) ou URL.
      cover: data.cover || null,
      coverAlt: data.coverAlt || "",
      items: normalizeItems(data.items, { slug, title: data.title || slug, date: data.date || slug }),
      content,
      // Busca da lista de edições: cobre a prosa que não virou item.
      searchText: normalize([data.title || slug, tags.join(" "), content].join(" ")),
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug) {
  return getAllPosts().find((p) => p.slug === slug) || null;
}

// Vizinhos para navegar entre edições. A lista vem ordenada por data desc,
// então o índice anterior é a edição mais nova.
export function getPostWithNeighbors(slug) {
  const posts = getAllPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return { post: null, newer: null, older: null };

  return {
    post: posts[i],
    newer: posts[i - 1] || null,
    older: posts[i + 1] || null,
  };
}

// Cada novidade do frontmatter, com a referência de volta para a edição.
function normalizeItems(items, post) {
  if (!Array.isArray(items)) return [];

  return items.map((item, i) => {
    const category = item.category || FALLBACK_CATEGORY;
    const title = item.title || "(sem título)";
    const summary = item.summary || "";

    return {
      id: `${post.slug}-${i}`,
      title,
      category,
      categorySlug: slugify(category),
      summary,
      source: item.source || null,
      postSlug: post.slug,
      postTitle: post.title,
      date: post.date,
      searchText: normalize([title, summary, category, post.title].join(" ")),
    };
  });
}

export function getAllItems() {
  // getAllPosts já vem ordenado por data desc; flatMap preserva a ordem
  // original dos itens dentro de cada edição.
  return getAllPosts().flatMap((p) => p.items);
}

// Categorias distintas com contagem: fixadas primeiro, depois por volume, e
// alfabética no empate.
export function getCategories() {
  const counts = new Map();

  for (const item of getAllItems()) {
    const entry = counts.get(item.categorySlug);
    if (entry) {
      entry.count += 1;
    } else {
      counts.set(item.categorySlug, {
        name: item.category,
        slug: item.categorySlug,
        count: 1,
      });
    }
  }

  return [...counts.values()].sort((a, b) => {
    const pinA = PINNED_CATEGORIES.indexOf(a.name);
    const pinB = PINNED_CATEGORIES.indexOf(b.name);
    if (pinA !== pinB) return (pinA < 0 ? Infinity : pinA) - (pinB < 0 ? Infinity : pinB);
    if (a.count !== b.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}
