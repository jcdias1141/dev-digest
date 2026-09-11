# Publicação semanal pelo GitHub Actions

O workflow `.github/workflows/weekly-digest.yml` pesquisa com a API do Claude,
gera `content/AAAA-MM-DD.md`, valida o build e, quando solicitado, faz commit e
push na `main`. Depois confere a home, a edição e suas páginas de novidades no
domínio principal. O agendamento só executa o job após a ativação descrita abaixo.

## 1. Colocar os arquivos no GitHub

No terminal deste projeto, revise `git diff` e os novos arquivos e execute:

```bash
git add .github/workflows/weekly-digest.yml scripts/digest-utils.mjs scripts/generate-digest.mjs scripts/verify-digest.mjs scripts/digest.test.mjs docs/automacao-semanal.md package.json .gitignore README.md .claude/routine-prompt.md
git commit -m "Adiciona automação semanal do Dev Digest"
git push origin main
```

Use sua autenticação normal do GitHub para esse primeiro push. O `GITHUB_TOKEN`
só existe durante a execução do Actions. Não coloque chaves em arquivos versionados.

## 2. Criar a chave da API

No [Console da Anthropic](https://platform.claude.com/), configure o faturamento
da API, um limite de gasto apropriado e crie uma API key. Confirme que o workspace
tem acesso ao modelo escolhido e à ferramenta de pesquisa web.

No GitHub, abra o repositório e vá a **Settings → Secrets and variables → Actions**.
Na aba **Secrets**, clique em **New repository secret**:

| Nome | Valor |
| --- | --- |
| `ANTHROPIC_API_KEY` | A chave da API da Anthropic |

A execução usa API e pesquisa web cobradas pela Anthropic; não pressupõe que sua
assinatura do Claude Code cubra esses custos. O código faz no máximo duas chamadas
à API por geração, até seis buscas e limites de 5.000/7.000 tokens de saída.
Esses limites não são um teto exato em reais ou dólares: há tokens de entrada,
buscas e o preço do modelo. Confira o consumo no Console. Uma reexecução que
precise gerar novamente também pode gerar cobrança. Não há retry automático de
chamadas da API dentro de uma execução.

## 3. Informar o domínio principal

Na aba **Variables**, clique em **New repository variable**:

| Nome | Valor |
| --- | --- |
| `DIGEST_SITE_URL` | Origem HTTPS do site de produção, por exemplo `https://seu-projeto.vercel.app`, sem `/post/...` |
| `CLAUDE_MODEL` | Opcional. Padrão: `claude-sonnet-5`; use um ID de modelo disponível na sua conta e compatível com web search |

Use o endereço estável de produção, não o endereço de um preview. Na Vercel,
confirme que este repositório está conectado e que a branch de produção é `main`.

Mantenha as permissões padrão de leitura do Actions. O job declara
`contents: write`, e usa o token automático do GitHub apenas na etapa de push.
As regras da branch continuam valendo; na configuração conferida para este
projeto não havia rulesets nem proteção clássica.

## 4. Rodar um teste

Abra **Actions → Digest semanal → Run workflow**, selecione `main` e deixe
**Publicar na main e verificar o site** desmarcado.

O teste usa a API quando a edição da semana ainda não existe. Calcula a segunda
mais recente no fuso de Brasília, pesquisa o intervalo da segunda anterior até
essa segunda e constrói o site. Não faz commit ou push. Na página da execução,
baixe o artefato `digest-...` para revisar o Markdown e `research.json`.

Confira especialmente as datas dos acontecimentos e se as fontes sustentam as
afirmações. As validações automáticas verificam estrutura, domínios, presença
de citações e intervalo de datas declarado, mas não comprovam sozinhas cada fato.
O modelo não recebe ferramentas de shell, escrita no GitHub ou credenciais de publicação.

Se a edição já existir em `content/`, ela será preservada e a API não será
chamada. O build verifica a edição existente. O teste não substitui posts antigos.

## 5. Publicar a primeira edição

Execute novamente, agora marcando **Publicar na main e verificar o site**.
Se ainda não houver edição commitada, essa execução faz uma NOVA geração;
o rascunho da execução anterior não é reutilizado automaticamente. Para publicar
exatamente um rascunho revisado, copie o `.md` do artefato para `content/`, faça
commit/push manual e rode o workflow com publicação para conferir o deploy.

O push é normal, sem force: alterações concorrentes na `main` podem fazê-lo falhar.
O conteúdo fica no artefato por 30 dias. Para recuperar o conteúdo exato, copie o
Markdown do artefato e publique manualmente. Reexecutar a tarefa sem um arquivo
commitado gera outra pesquisa. Se o push já funcionou e só o deploy falhou,
reexecutar preserva a edição que está no GitHub e verifica novamente sua publicação.

O workflow espera até aproximadamente 12 minutos pela publicação no domínio
principal. Um resultado de falha após o push não desfaz o commit nem um deploy:
abra o painel da Vercel para conferir o motivo antes de reexecutar.

Se a integração Git não disparar o deploy, confira primeiro o log e as permissões
de autoria/colaboração do commit na Vercel. O commit da automação é identificado
como `github-actions[bot]`; a aceitação depende da configuração/plano do projeto.
Um Deploy Hook não ignora restrições de colaboração.

Quando precisar de um disparo explícito, crie na Vercel em **Settings → Git →
Deploy Hooks** um hook para `main`. Salve sua URL como secret
`VERCEL_DEPLOY_HOOK` no GitHub. O workflow chama esse hook após o push (ou ao
reverificar uma edição existente). Ele é opcional; se a integração Git já publica,
deixe-o vazio para evitar disparos adicionais. Trate a URL como uma senha.

## 6. Ativar as segundas-feiras

Depois de uma publicação manual confirmada no domínio principal, crie a
**repository variable** `ENABLE_WEEKLY_DIGEST` com valor `true`.

O job passa a executar às **06h17 de segunda-feira, horário de Brasília**, com
uma segunda tentativa às **09h17**. Se o arquivo já foi commitado, a segunda
execução preserva o conteúdo e verifica o deploy, sem gasto adicional de API.
Se estiver ausente, tenta uma nova geração. Horários do Actions podem atrasar;
o mecanismo não garante execução em horário exato.

Desative a rotina antiga em `https://claude.ai/code/routines` quando concluir a
migração, para não haver dois publicadores. Para pausar o job agendado, defina
`ENABLE_WEEKLY_DIGEST=false`; a execução manual continua disponível.

Nas configurações de notificações da sua conta GitHub, habilite notificações
de falha do Actions e confirme que você as recebe. Não há envio de e-mail próprio
implementado neste repositório. Em repositórios públicos, o GitHub pode desativar
agendamentos após 60 dias sem atividade; confira a aba Actions se as execuções
pararem. Uma execução falhar explicitamente é preferível a publicar notícias
inventadas para preencher a semana.

## Validação local

```bash
npm run digest:test
npm run build
DIGEST_DATE=2026-08-17 npm run digest:verify -- build
```

`npm run digest:generate` é o comando que usa a API e pode criar um post local.
Ele requer `ANTHROPIC_API_KEY` no ambiente e não carrega `.env` automaticamente.
Não execute esse comando apenas para testar a configuração de permissões.

Referências: [permissões do token](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token),
[agendamentos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[pesquisa web da API](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool),
[modelos](https://platform.claude.com/docs/en/models/overview),
[Deploy Hooks](https://vercel.com/docs/deploy-hooks).
