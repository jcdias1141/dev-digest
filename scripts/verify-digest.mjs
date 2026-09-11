import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import matter from 'gray-matter';
import { monday } from './digest-utils.mjs';

const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

function siteUrl() {
  const url = new URL(process.env.DIGEST_SITE_URL || '');
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('DIGEST_SITE_URL deve ser a origem HTTPS do site principal, sem caminho ou credenciais.');
  return url;
}

async function main() {
  const mode = process.argv[2] || 'build';
  if (mode === 'config') { siteUrl(); return; }
  if (!['build', 'deployed'].includes(mode)) throw new Error('Use build, deployed ou config.');
  const date = process.env.DIGEST_DATE || monday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('DIGEST_DATE inválida.');
  const { data } = matter(await fs.readFile(`content/${date}.md`, 'utf8'));
  const postPath = `/post/${date}`;
  const source = mode === 'build' ? null : siteUrl();
  const manifest = mode === 'build' ? JSON.parse(await fs.readFile('.next/prerender-manifest.json', 'utf8')) : null;

  async function read(route) {
    if (manifest) {
      if (!manifest.routes[route]) throw new Error(`Rota ausente do build: ${route}`);
      return fs.readFile(`.next/server/app${route === '/' ? '/index' : route}.html`, 'utf8');
    }
    const url = new URL(route, source);
    url.searchParams.set('digest_check', String(Date.now()));
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), cache: 'no-store' });
    if (!response.ok) throw new Error(`Site retornou HTTP ${response.status} em ${route}.`);
    return response.text();
  }

  async function check() {
    const home = await read('/');
    if (!home.includes(`href="${postPath}"`)) throw new Error('Edição ainda não aparece na home.');
    const post = await read(postPath);
    if (!post.includes(escapeHtml(data.title))) throw new Error('Página da edição ainda não contém o título esperado.');
    const routes = [...new Set([...post.matchAll(/href="(\/novidade\/[^"?#]+)"/g)].map(match => match[1]))];
    if (!data.items?.length || routes.length !== data.items.length)
      throw new Error('Quantidade de páginas de novidades diferente dos itens da edição.');
    for (let index = 0; index < routes.length; index++) {
      const html = await read(routes[index]);
      if (!html.includes(escapeHtml(data.items[index].title)))
        throw new Error(`Conteúdo esperado ausente em ${routes[index]}.`);
    }
  }

  const deadline = Date.now() + (mode === 'deployed' ? 12 * 60_000 : 0);
  while (true) {
    try {
      await check();
      console.log(`${mode === 'build' ? 'Build validado' : 'Publicação confirmada no site principal'}: ${postPath}`);
      return;
    } catch (error) {
      if (Date.now() >= deadline) throw error;
      console.log(`${error.message} Aguardando o deploy...`);
      await setTimeout(20_000);
    }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
