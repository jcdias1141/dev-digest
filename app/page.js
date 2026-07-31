import DigestBrowser from "./DigestBrowser";
import { getAllItems, getAllPosts, getCategories } from "../lib/posts";
import { formatDate } from "../lib/format";

export default function Home() {
  const posts = getAllPosts();

  if (posts.length === 0) {
    return (
      <p className="text-neutral-500">
        Nenhum digest ainda. Assim que a tarefa de segunda escrever o primeiro
        arquivo em <code className="text-neutral-300">content/</code>, ele
        aparece aqui.
      </p>
    );
  }

  const items = getAllItems();
  const categories = getCategories();
  const [latest] = posts;

  // O componente client recebe só o que precisa — o corpo markdown fica no
  // servidor, exceto o searchText já normalizado.
  const editions = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    searchText: p.searchText,
  }));

  return (
    <div>
      <a
        href={`/post/${latest.slug}`}
        className="group grid gap-6 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-neutral-700 sm:grid-cols-[1fr_16rem] sm:items-center"
      >
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
            Esta semana
          </span>
          <h2 className="mt-2 text-2xl font-bold text-neutral-100 group-hover:text-emerald-300">
            {latest.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {formatDate(latest.date)}
          </p>
          {latest.items.length > 0 && (
            <p className="mt-3 text-sm text-neutral-400">
              {latest.items
                .slice(0, 3)
                .map((i) => i.title)
                .join(" · ")}
            </p>
          )}
        </div>
        {latest.cover && (
          <img
            src={latest.cover}
            alt=""
            className="aspect-[16/9] w-full rounded-lg border border-neutral-800 object-cover"
          />
        )}
      </a>

      <div className="mt-14">
        <DigestBrowser
          items={items}
          categories={categories}
          editions={editions}
        />
      </div>
    </div>
  );
}
