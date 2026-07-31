import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
// O <details> do gabarito é HTML bruto no markdown; sem rehype-raw o
// react-markdown o imprime como texto literal.
import rehypeRaw from "rehype-raw";
import { getAllPosts, getPostWithNeighbors } from "../../../lib/posts";
import { formatDate } from "../../../lib/format";
import { CategoryBadge } from "../../DigestBrowser";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const { post, newer, older } = getPostWithNeighbors(slug);

  if (!post) {
    return <p className="text-neutral-500">Digest não encontrado.</p>;
  }

  return (
    <article>
      <a
        href="/"
        className="text-sm text-neutral-600 transition hover:text-neutral-300"
      >
        ← todas as edições
      </a>

      <h1 className="mt-4 text-[42px] font-bold leading-tight tracking-tight text-emerald-400">
        {post.title}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">{formatDate(post.date)}</p>

      {post.cover && (
        /* <img> simples em vez de next/image: aceita tanto caminho local
           quanto URL externa sem mexer em remotePatterns/dangerouslyAllowSVG. */
        <img
          src={post.cover}
          alt={post.coverAlt}
          className="mt-8 h-56 w-full rounded-xl border border-neutral-800 object-cover sm:h-72"
        />
      )}

      {post.items.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Nesta edição
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {post.items.map((item) => (
              <li
                key={item.id}
                id={item.id}
                /* scroll-mt: o header é sticky, senão a âncora fica escondida
                   atrás dele. target: destaca o item que veio da home. */
                className="scroll-mt-24 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 target:border-emerald-400/40 target:bg-emerald-400/5"
              >
                <CategoryBadge name={item.category} slug={item.categorySlug} />
                <h3 className="mt-2.5 text-2xl font-bold leading-snug text-neutral-100">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="mt-2 text-base leading-relaxed text-neutral-400">
                    {item.summary}
                  </p>
                )}
                {item.source && (
                  <a
                    href={item.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    fonte ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="prose prose-invert mt-14 max-w-none text-[18px] leading-[1.7] prose-headings:font-bold prose-h2:mt-12 prose-h2:text-2xl prose-p:text-[18px] prose-li:text-[18px] prose-a:text-emerald-400 prose-code:text-emerald-300">
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {post.content}
        </Markdown>
      </div>

      {(newer || older) && (
        <nav
          aria-label="Outras edições"
          className="mt-16 grid gap-3 border-t border-neutral-900 pt-8 sm:grid-cols-2"
        >
          {older ? (
            <NeighborLink post={older} direction="older" />
          ) : (
            <span />
          )}
          {newer ? <NeighborLink post={newer} direction="newer" /> : null}
        </nav>
      )}
    </article>
  );
}

function NeighborLink({ post, direction }) {
  const isNewer = direction === "newer";

  return (
    <a
      href={`/post/${post.slug}`}
      className={
        "group rounded-lg border border-neutral-800 p-4 transition hover:border-neutral-700 " +
        (isNewer ? "sm:text-right" : "")
      }
    >
      <span className="text-xs text-neutral-600">
        {isNewer ? "Edição mais recente →" : "← Edição anterior"}
      </span>
      <span className="mt-1 block font-bold text-neutral-200 group-hover:text-emerald-300">
        {post.title}
      </span>
    </a>
  );
}
