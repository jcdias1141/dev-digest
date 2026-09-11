import matter from 'gray-matter';

export const domains = [
  'anthropic.com', 'claude.com', 'cursor.com', 'github.blog',
  'github.com/anthropics/claude-code', 'github.com/vercel/next.js',
  'openai.com', 'vercel.com', 'nextjs.org', 'react.dev',
  'tailwindcss.com', 'php.net', 'laravel.com', 'windsurf.com',
];

export function monday(now = new Date()) {
  const local = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const date = new Date(`${local}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}

export function sourceAllowed(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      (!url.port || url.port === '443') && domains.some(entry => {
        const [host, ...path] = entry.split('/');
        const prefix = '/' + path.join('/');
        return (url.hostname === host || url.hostname.endsWith(`.${host}`)) &&
          (prefix === '/' || url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
      });
  } catch { return false; }
}

export function slugify(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function validateDigest(draft, date, citations, previousTitles = []) {
  const fail = message => { throw new Error(message); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (!text(draft.title) || !text(draft.content)) fail('Título ou corpo ausente.');
  if (!Array.isArray(draft.tags) || !draft.tags.length ||
      draft.tags.some(tag => !text(tag) || !/^[a-z0-9-]+$/.test(tag))) fail('Tags inválidas.');
  if (!Array.isArray(draft.items) || draft.items.length < 1 || draft.items.length > 8)
    fail('A edição precisa de 1 a 8 notícias verificáveis.');
  const start = new Date(`${date}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 7);
  const lower = start.toISOString().slice(0, 10);
  const titles = new Set(previousTitles.map(slugify));
  for (const item of draft.items) {
    if (!['title', 'summary', 'body', 'source', 'event_date'].every(key => text(item[key])))
      fail('Notícia sem título, resumo, corpo, fonte ou data do acontecimento.');
    if (!['Claude Code', 'Outras ferramentas', 'Modelos', 'Frameworks'].includes(item.category))
      fail('Categoria inválida.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.event_date) ||
        !Number.isFinite(Date.parse(`${item.event_date}T00:00:00Z`)) ||
        new Date(`${item.event_date}T00:00:00Z`).toISOString().slice(0, 10) !== item.event_date ||
        item.event_date < lower || item.event_date > date) fail('Notícia fora do período da edição.');
    if (!sourceAllowed(item.source) || !citations.has(item.source))
      fail('Fonte ausente das citações verificadas da pesquisa ou fora dos domínios permitidos.');
    if (/[`*]|\[[^\]]+\]\(/.test(item.summary)) fail('Resumo deve ser texto puro.');
    const slug = slugify(item.title);
    if (!slug || titles.has(slug)) fail('Título repetido ou inválido.');
    titles.add(slug);
  }
  for (const heading of ['## Fixar o que li', '## Retomando'])
    if (!draft.content.includes(heading)) fail(`Falta ${heading}.`);
  // As páginas aceitam HTML bruto; a automação só precisa dos elementos do gabarito.
  const prose = [draft.content, ...draft.items.map(item => item.body)].join('\n');
  if (/<(?!\/?(?:details|summary)>)[a-z!/][^>]*>/i.test(prose))
    fail('HTML não permitido no conteúdo automático. Use Markdown e apenas details/summary sem atributos.');
  if (/\]\(\s*(?:javascript|data):/i.test(prose)) fail('Link não permitido.');
  return draft;
}

export function renderDigest(draft, date) {
  return matter.stringify(draft.content, {
    title: draft.title,
    // Mesma representação Date dos arquivos existentes, para preservar a ordenação.
    date: new Date(`${date}T00:00:00Z`),
    tags: draft.tags,
    items: draft.items.map(({ title, category, summary, source, body, event_date }) =>
      ({ title, category, summary, source, body, event_date })),
  });
}

export function researchEvidence(response) {
  const blocks = (response.content || []).filter(block => block.type === 'text');
  const citations = blocks.flatMap(block => (block.citations || [])
    .filter(citation => citation.type === 'web_search_result_location' && sourceAllowed(citation.url))
    .map(({ url, title, cited_text }) => ({ url, title, cited_text })));
  if (!citations.length) throw new Error('A pesquisa não retornou citações de fontes oficiais.');
  return {
    report: blocks.map(block => block.text).join('\n'), citations,
  };
}
