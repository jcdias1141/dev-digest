import test from 'node:test';
import assert from 'node:assert/strict';
import matter from 'gray-matter';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { monday, sourceAllowed, validateDigest, renderDigest, researchEvidence } from './digest-utils.mjs';

const source = 'https://www.anthropic.com/news/example';
const draft = () => ({
  title: 'Digest — 14 de setembro', tags: ['claude-code'],
  content: '## Fixar o que li\nPergunta?\n<details><summary>Gabarito</summary>Resposta.</details>\n\n## Retomando\nEdições anteriores.',
  items: [{ title: 'Uma novidade', summary: 'Uma descrição em texto puro.', category: 'Claude Code',
    source, event_date: '2026-09-10', body: 'Descrição.\n\n## Por que importa\nImpacto.' }],
});
const validate = value => validateDigest(value, '2026-09-14', new Set([source]));

test('segunda-feira usa Brasília inclusive na virada da semana/ano', () => {
  assert.equal(monday(new Date('2026-09-14T02:59:59Z')), '2026-09-07');
  assert.equal(monday(new Date('2026-09-14T03:00:00Z')), '2026-09-14');
  assert.equal(monday(new Date('2027-01-01T12:00:00Z')), '2026-12-28');
});
test('fontes restringem domínio, protocolo, credenciais e repositórios', () => {
  assert.ok(sourceAllowed(source));
  assert.ok(sourceAllowed('https://github.com/anthropics/claude-code/releases/tag/v1'));
  for (const url of ['https://anthropic.com.evil.test/news', 'http://anthropic.com',
    'https://user:pass@anthropic.com', 'https://github.com/other/repo',
    'https://github.com/anthropics/claude-code-fake', 'https://127.0.0.1'])
    assert.equal(sourceAllowed(url), false, url);
});
test('apenas resultados não bastam: exige citações da pesquisa', () => {
  assert.throws(() => researchEvidence({ content: [{ type: 'text', text: 'Sem fontes.' }] }));
  const evidence = researchEvidence({ content: [{ type: 'text', text: 'Fato.',
    citations: [{ type: 'web_search_result_location', url: source, title: 'Anúncio', cited_text: 'Trecho' }] }] });
  assert.equal(evidence.citations[0].url, source);
});
test('rejeita fonte inventada, data antiga/futura/inválida, título repetido e HTML ativo', () => {
  for (const patch of [{ source: 'https://anthropic.com/news/invented' },
    { event_date: '2026-09-06' }, { event_date: '2026-09-15' }, { event_date: '2026-02-31' },
    { body: '<script>alert(1)</script>' }, { body: '<details onclick="alert(1)">x</details>' },
    { summary: 'Resumo com **Markdown**' }]) {
    const value = draft(); Object.assign(value.items[0], patch);
    assert.throws(() => validate(value));
  }
  const value = draft(); value.items.push({ ...value.items[0] });
  assert.throws(() => validate(value));
  assert.throws(() => validateDigest(draft(), '2026-09-14', new Set([source]), ['Uma novidade']));
});
test('Markdown gerado mantém Date, itens e gabarito compatíveis com o site', () => {
  const value = validate(draft());
  const parsed = matter(renderDigest(value, '2026-09-14'));
  assert.ok(parsed.data.date instanceof Date);
  assert.equal(parsed.data.date.toISOString(), '2026-09-14T00:00:00.000Z');
  assert.deepEqual(parsed.data.items, value.items);
  assert.equal(parsed.content.trim(), value.content);
});

test('geração completa com API simulada, limites e reexecução sem sobrescrever', t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-digest-test-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  fs.mkdirSync(path.join(cwd, 'content'));
  const value = draft(); value.items[0].event_date = monday();
  const mock = path.join(cwd, 'mock.mjs');
  fs.writeFileSync(mock, `
    import fs from 'node:fs';
    import assert from 'node:assert/strict';
    let count = 0;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.anthropic.com/v1/messages');
      assert.equal(options.headers['x-api-key'], 'fake-test-key');
      const body = JSON.parse(options.body);
      count++;
      if (count === 1) {
        assert.equal(body.tools[0].max_uses, 6);
        assert.equal(body.max_tokens, 5000);
      } else {
        assert.equal(body.tools, undefined);
        assert.equal(body.max_tokens, 7000);
      }
      if (process.env.MOCK_FAIL === 'http') return { ok: false, status: 401, headers: new Headers() };
      if (process.env.MOCK_FAIL === 'bad-request') return {
        ok: false, status: 400, headers: new Headers(),
        json: async () => ({
          error: { type: 'invalid_request_error', message: 'Your credit balance is too low. fake-test-key sk-ant-test-secret' },
          request_id: 'req_test_400'
        })
      };
      fs.appendFileSync('calls.txt', 'call\\n');
      return { ok: true, json: async () => ({
        stop_reason: process.env.MOCK_FAIL === 'truncated' ? 'max_tokens' : 'end_turn',
        content: count === 1 ? [{ type: 'text', text: 'Pesquisa.', citations: [{
          type: 'web_search_result_location', url: ${JSON.stringify(source)}, title: 'Anúncio', cited_text: 'Trecho'
        }] }] : [{ type: 'text', text: ${JSON.stringify(JSON.stringify(value))} }],
        usage: { input_tokens: 10, output_tokens: 10 }
      }) };
    };
  `);
  const script = fileURLToPath(new URL('./generate-digest.mjs', import.meta.url));
  const run = (extra = {}) => spawnSync(process.execPath, ['--import', mock, script], {
    cwd, encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: 'fake-test-key',
      GITHUB_OUTPUT: path.join(cwd, 'output.txt'), ...extra },
  });
  const fail = run({ MOCK_FAIL: 'http' });
  assert.equal(fail.status, 1);
  assert.match(fail.stderr, /HTTP 401/);
  assert.equal(fs.existsSync(path.join(cwd, `content/${monday()}.md`)), false);
  const badRequest = run({ MOCK_FAIL: 'bad-request' });
  assert.equal(badRequest.status, 1);
  assert.match(badRequest.stderr, /HTTP 400 \(invalid_request_error\)/);
  assert.match(badRequest.stderr, /Your credit balance is too low/);
  assert.match(badRequest.stderr, /req_test_400/);
  assert.doesNotMatch(badRequest.stderr, /fake-test-key|sk-ant-test-secret/);
  assert.equal(fs.existsSync(path.join(cwd, `content/${monday()}.md`)), false);
  const truncated = run({ MOCK_FAIL: 'truncated' });
  assert.equal(truncated.status, 1);
  assert.equal(fs.existsSync(path.join(cwd, `content/${monday()}.md`)), false);
  const generated = run();
  assert.equal(generated.status, 0, generated.stderr);
  const file = path.join(cwd, `content/${monday()}.md`);
  const markdown = fs.readFileSync(file, 'utf8');
  assert.ok(matter(markdown).data.date instanceof Date);
  assert.ok(fs.existsSync(path.join(cwd, '.digest/research.json')));
  const calls = fs.readFileSync(path.join(cwd, 'calls.txt'), 'utf8');
  const repeated = run({ MOCK_FAIL: 'http' });
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.equal(fs.readFileSync(file, 'utf8'), markdown);
  assert.equal(fs.readFileSync(path.join(cwd, 'calls.txt'), 'utf8'), calls);
});

test('verificação de produção consulta home, edição e cada novidade', t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-digest-verify-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  fs.mkdirSync(path.join(cwd, 'content'));
  fs.writeFileSync(path.join(cwd, 'content/2026-09-14.md'), renderDigest(draft(), '2026-09-14'));
  const pages = {
    '/': '<a href="/post/2026-09-14">Edição</a>',
    '/post/2026-09-14': '<h1>Digest — 14 de setembro</h1><a href="/novidade/uma-novidade">Leia</a>',
    '/novidade/uma-novidade': '<h1>Uma novidade</h1>',
  };
  const mock = path.join(cwd, 'mock.mjs');
  fs.writeFileSync(mock, `
    import fs from 'node:fs';
    const pages = ${JSON.stringify(pages)};
    globalThis.fetch = async url => {
      if (url.origin !== 'https://digest.example') throw new Error('Origem incorreta');
      fs.appendFileSync('routes.txt', url.pathname + '\\n');
      return new Response(pages[url.pathname] || '', { status: pages[url.pathname] ? 200 : 404 });
    };
  `);
  const script = fileURLToPath(new URL('./verify-digest.mjs', import.meta.url));
  const result = spawnSync(process.execPath, ['--import', mock, script, 'deployed'], {
    cwd, encoding: 'utf8', env: { ...process.env, DIGEST_SITE_URL: 'https://digest.example', DIGEST_DATE: '2026-09-14' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fs.readFileSync(path.join(cwd, 'routes.txt'), 'utf8').trim().split('\n'), Object.keys(pages));
});
