import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { getAllItems, getItemWithNeighbors } from "../../../lib/posts";
import { CategoryBadge } from "../../DigestBrowser";
import DateLine from "../../DateLine";

export function generateStaticParams() {
  return getAllItems().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item } = getItemWithNeighbors(slug);
  if (!item) return {};

  return {
    title: `${item.title} — Dev Digest`,
    description: item.summary,
  };
}

export default async function ItemPage({ params }) {
  const { slug } = await params;
  const { item, prev, next, post } = getItemWithNeighbors(slug);

  if (!item) {
    return <p className="text-neutral-500">Novidade não encontrada.</p>;
  }

  return (
    <article className="mx-auto max-w-3xl">
      <a
        href={`/post/${item.postSlug}`}
        className="text-sm text-neutral-600 transition hover:text-neutral-300"
      >
        ← {item.postTitle}
      </a>

      <div className="mt-5 flex items-center gap-3">
        <CategoryBadge name={item.category} slug={item.categorySlug} />
        <DateLine date={item.date} />
      </div>

      <h1 className="mt-4 text-[42px] font-bold leading-tight tracking-tight text-emerald-400">
        {item.title}
      </h1>

      {/* O resumo vira lead: é o mesmo texto que o leitor viu no card da home,
          então serve de ponte entre o clique e o texto longo. */}
      {item.summary && (
        <p className="mt-5 text-xl leading-relaxed text-neutral-300">
          {item.summary}
        </p>
      )}

      {item.body ? (
        <div className="prose prose-invert mt-8 max-w-none text-[18px] leading-[1.7] prose-headings:font-bold prose-h2:mt-10 prose-h2:text-2xl prose-p:text-[18px] prose-li:text-[18px] prose-a:text-emerald-400 prose-code:text-emerald-300">
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {item.body}
          </Markdown>
        </div>
      ) : (
        <p className="mt-8 text-sm text-neutral-600">
          Esta novidade ainda não tem texto longo — veja a fonte original abaixo.
        </p>
      )}

      {item.source && (
        <a
          href={item.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2 rounded-lg border border-neutral-800 px-4 py-2.5 text-sm text-emerald-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
        >
          Ler na fonte original
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </a>
      )}

      {(prev || next) && (
        <nav
          aria-label="Outras novidades desta edição"
          className="mt-16 grid gap-3 border-t border-neutral-900 pt-8 sm:grid-cols-2"
        >
          {prev ? <SiblingLink item={prev} direction="prev" /> : <span />}
          {next ? <SiblingLink item={next} direction="next" /> : null}
        </nav>
      )}

      <p className="mt-8 text-sm text-neutral-600">
        Publicado em{" "}
        <a
          href={`/post/${post.slug}`}
          className="text-neutral-400 hover:text-emerald-300"
        >
          {post.title}
        </a>
      </p>
    </article>
  );
}

function SiblingLink({ item, direction }) {
  const isNext = direction === "next";

  return (
    <a
      href={`/novidade/${item.slug}`}
      className={
        "group rounded-lg border border-neutral-800 p-4 transition hover:border-neutral-700 " +
        (isNext ? "sm:text-right" : "")
      }
    >
      <span className="text-xs text-neutral-600">
        {isNext ? "Próxima nesta edição →" : "← Anterior nesta edição"}
      </span>
      <span className="mt-1 block font-bold text-neutral-200 group-hover:text-emerald-300">
        {item.title}
      </span>
    </a>
  );
}
