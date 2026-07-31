"use client";

import { useEffect, useMemo, useState } from "react";
import { formatShortDate, normalize } from "../lib/format";

const PAGE_SIZE = 12;

export default function DigestBrowser({ items, categories, editions }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Query dividida em termos; um resultado passa se casar com TODOS eles.
  const terms = useMemo(
    () => normalize(query).split(/\s+/).filter(Boolean),
    [query]
  );

  const matches = (searchText) => terms.every((t) => searchText.includes(t));

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (category === "todos" || item.categorySlug === category) &&
          matches(item.searchText)
      ),
    [items, category, terms]
  );

  // Mudou o filtro, a paginação recomeça — senão o usuário volta a uma
  // lista já expandida de outro recorte.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, query]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const remaining = filteredItems.length - visibleItems.length;

  // A lista de edições responde só à busca — filtrar edição por categoria de
  // item seria enganoso, já que uma edição cobre várias categorias.
  const visibleEditions = useMemo(
    () => editions.filter((e) => matches(e.searchText)),
    [editions, terms]
  );

  function clearFilters() {
    setQuery("");
    setCategory("todos");
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[13rem_1fr]">
      {/* Navegação: acompanha a rolagem em telas largas. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <label htmlFor="busca" className="sr-only">
          Buscar novidades
        </label>
        <input
          id="busca"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-700"
        />

        <nav aria-label="Categorias" className="mt-5 space-y-0.5">
          <CategoryLink
            active={category === "todos"}
            onClick={() => setCategory("todos")}
            label="Todos"
            count={items.length}
          />
          {categories.map((cat) => (
            <CategoryLink
              key={cat.slug}
              active={category === cat.slug}
              onClick={() => setCategory(cat.slug)}
              label={cat.name}
              count={cat.count}
            />
          ))}
        </nav>

        <p aria-live="polite" className="mt-5 text-xs text-neutral-600">
          {filteredItems.length}{" "}
          {filteredItems.length === 1 ? "novidade" : "novidades"}
          {remaining > 0 ? ` · mostrando ${visibleItems.length}` : ""}
        </p>
      </aside>

      <section>
        {visibleItems.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-5 py-10 text-center">
            <p className="text-sm text-neutral-400">
              Nada encontrado
              {query ? (
                <>
                  {" "}
                  para <span className="text-neutral-200">“{query}”</span>
                </>
              ) : null}
              .
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {visibleItems.map((item) => (
              <Item key={item.id} item={item} />
            ))}
          </ul>
        )}

        {remaining > 0 && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="rounded-full border border-neutral-800 px-5 py-2 text-sm text-neutral-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              Carregar mais ({remaining})
            </button>
          </div>
        )}

        <div className="mt-20 border-t border-neutral-900 pt-8">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Todas as edições
          </h2>
          {visibleEditions.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Nenhuma edição casa com a busca.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-900">
              {visibleEditions.map((e) => (
                <li key={e.slug}>
                  <a
                    href={`/post/${e.slug}`}
                    className="flex items-baseline justify-between gap-4 py-3 text-neutral-300 transition hover:text-emerald-400"
                  >
                    <span className="text-[15px]">{e.title}</span>
                    <span className="shrink-0 text-xs text-neutral-600">
                      {formatShortDate(e.date)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function CategoryLink({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition " +
        (active
          ? "bg-emerald-400/10 text-emerald-300"
          : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200")
      }
    >
      <span>{label}</span>
      <span className={active ? "text-xs text-emerald-400/60" : "text-xs text-neutral-600"}>
        {count}
      </span>
    </button>
  );
}

// Mascote do Claude Code em pixel art, traçado a partir do ícone oficial
// numa grade 16x10. Usa currentColor para acompanhar a cor do badge; a cor
// da marca é #D87757, se preferir fixá-la.
function ClaudeMark(props) {
  return (
    <svg
      viewBox="0 0 16 10"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="0" width="12" height="2" />
      <rect x="2" y="2" width="2" height="2" />
      <rect x="5" y="2" width="6" height="2" />
      <rect x="12" y="2" width="2" height="2" />
      <rect x="0" y="4" width="16" height="2" />
      <rect x="2" y="6" width="12" height="2" />
      <rect x="3" y="8" width="1" height="2" />
      <rect x="5" y="8" width="1" height="2" />
      <rect x="10" y="8" width="1" height="2" />
      <rect x="12" y="8" width="1" height="2" />
    </svg>
  );
}

function LayersMark(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 15.5 12 20l9-4.5" />
    </svg>
  );
}

function DotMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

const CATEGORY_MARKS = {
  "claude-code": ClaudeMark,
  frameworks: LayersMark,
};

export function CategoryBadge({ name, slug }) {
  const Mark = CATEGORY_MARKS[slug] || DotMark;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 py-1.5 pl-2.5 pr-3.5 text-[11px] font-medium uppercase tracking-wide text-emerald-300">
      {/* w-auto: cada marca tem sua própria proporção (o mascote é 16x10). */}
      <Mark className="h-3.5 w-auto shrink-0" />
      <span aria-hidden="true" className="h-3 w-px bg-emerald-400/30" />
      {name}
    </span>
  );
}

function Item({ item }) {
  return (
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-neutral-700 hover:bg-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <CategoryBadge name={item.category} slug={item.categorySlug} />
        <span className="shrink-0 text-xs text-neutral-600">
          {formatShortDate(item.date)}
        </span>
      </div>
      <h3 className="mt-2.5 text-2xl font-bold leading-snug text-neutral-100">
        {item.title}
      </h3>
      {item.summary && (
        <p className="mt-2 text-base leading-relaxed text-neutral-400">
          {item.summary}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-neutral-800/60 pt-3 text-xs">
        {item.source && (
          <a
            href={item.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            fonte ↗
          </a>
        )}
        <a
          href={`/post/${item.postSlug}`}
          className="text-neutral-600 hover:text-neutral-300"
        >
          {item.postTitle}
        </a>
      </div>
    </li>
  );
}
