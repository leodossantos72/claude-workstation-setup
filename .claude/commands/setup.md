Voce e um agente de setup. Execute TODOS os passos abaixo em sequencia.
Ao final de cada passo, informe o que foi feito. Se algo falhar, informe o erro e tente uma alternativa.

IMPORTANTE: Todos os caminhos sao detectados dinamicamente. NUNCA use caminhos hardcoded.
Guarde tudo em variaveis mentais para reutilizar nos passos seguintes.

## 1. Detectar ambiente

- Identifique o sistema operacional (Windows ou macOS)
- Identifique o shell atual (PowerShell, bash, zsh)
- Encontre a pasta Documentos do usuario. Verificar nesta ordem:
  - Windows com OneDrive: ~/OneDrive/Documentos ou ~/OneDrive/Documents
  - Windows local: ~/Documents ou ~/Documentos
  - macOS: ~/Documents
- Encontre a pasta Downloads do usuario
- Detecte o diretorio atual do repositorio (onde este skill esta rodando) — este e o REPO_PATH
- Guarde os caminhos em variaveis mentais: DOCS_PATH, DOWNLOADS_PATH, REPO_PATH
- Informe: "Detectei: [SO], Documentos em [caminho], Downloads em [caminho], Repo em [caminho]"

## 2. Instalar Node.js (necessario para MCP)

Este passo deve ser 100% automatico. O mentorado NAO faz nada manual.

### 2a. Verificar se Node.js ja existe

Rode `node --version`. Se funcionar, pule para 2d.

### 2b. Se `node` nao foi encontrado no PATH (Windows)

No Windows com Git Bash, o Node.js pode estar instalado mas fora do PATH do bash.
Execute TODOS estes checks automaticamente, sem perguntar nada ao usuario:

1. Tente: `"/c/Program Files/nodejs/node.exe" --version`
2. Tente: `cmd.exe /c "node --version" 2>/dev/null`

Se QUALQUER um retornar versao, o Node.js ja esta instalado. Va para 2c.
Se NENHUM retornar versao, instale:
- Windows: `winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements`
- macOS: `brew install node` (se brew existir) ou `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && source ~/.bashrc && nvm install --lts`

Apos instalar, aguarde 5 segundos e verifique novamente nos mesmos caminhos.

### 2c. Corrigir PATH automaticamente (Windows Git Bash)

Se `node --version` falhar mas `"/c/Program Files/nodejs/node.exe" --version` funcionar:

1. Rode imediatamente: `export PATH="$PATH:/c/Program Files/nodejs"`
2. Verifique que `node --version` agora funciona
3. Para persistir em futuras sessoes do Git Bash, adicione ao ~/.bashrc:
   ```
   echo '' >> ~/.bashrc
   echo '# Node.js PATH (adicionado pelo setup Claude Workstation)' >> ~/.bashrc
   echo 'export PATH="$PATH:/c/Program Files/nodejs"' >> ~/.bashrc
   ```

IMPORTANTE: Este passo e executado pelo skill automaticamente. O mentorado nao precisa fazer nada.

### 2d. Detectar caminho do Node.js

Descubra onde o Node.js esta instalado e guarde como NODE_PATH:
- Rode: `which node` ou `command -v node`
- Se nao encontrar, tente: `ls "/c/Program Files/nodejs/node.exe"` (Windows)
- macOS: tente `which node` ou `/usr/local/bin/node`

Guarde o DIRETORIO (sem o executavel) como NODE_PATH.
Exemplo: se node esta em `/c/Program Files/nodejs/node.exe`, NODE_PATH = `/c/Program Files/nodejs`

### 2e. Validar npx

Rode `npx --version`.
Se ambos falharem, informe o erro e pare o setup.

Informe: "Node.js [versao] instalado e funcionando. Caminho: [NODE_PATH]"

## 3. Criar estrutura de pastas em Documentos

Dentro de DOCS_PATH, crie (nao sobrescrever pastas que ja existam):

```
Consultorias/
  _templates/
  _overview/
Ventures/
Metodos/
_Misc/
_Gerados/
  documentos/
  apresentacoes/
  planilhas/
  web/
  marketing/
  design/
```

A pasta _Gerados/ e o destino padrao para arquivos criados por skills quando nao ha contexto de cliente/projeto especifico.

## 4. Criar CLAUDE.md na raiz de Documentos

Se ja existir um CLAUDE.md, PRESERVE o conteudo existente e apenas adicione o que faltar.

Se nao existir, criar DOCS_PATH/CLAUDE.md com este conteudo:

```
# Workspace

Este e o workspace principal de documentos de trabalho assistido por IA.

## Estrutura

- `Consultorias/` - projetos e clientes
  - `_templates/` - templates padrao compartilhados
  - `_overview/` - indices e visao consolidada
- `Ventures/` - negocios proprios / sociedades
- `Metodos/` - frameworks e metodologias
- `_Misc/` - documentos diversos
- `_Gerados/` - arquivos criados por skills (destino padrao quando sem contexto)
  - `documentos/` - Word, PDF
  - `apresentacoes/` - PowerPoint, HTML
  - `planilhas/` - Excel, CSV
  - `web/` - landing pages, sites
  - `marketing/` - copies, calendarios
  - `design/` - imagens, banners

## Roteamento automatico (skills-first)

REGRA PRINCIPAL: Antes de executar qualquer tarefa, verifique se existe um skill instalado que faz isso. Se existir, use claude-code para executar (os skills estao em ~/.claude/skills/). Se nao existir skill, decida entre filesystem e claude-code conforme a tabela abaixo.

Voce tem dois MCPs disponiveis. Use o correto automaticamente:

| Tarefa | Ferramenta |
|--------|-----------|
| Ler/escrever arquivos simples | filesystem |
| Listar pastas, mover arquivos | filesystem |
| Criar resumos de texto | filesystem |
| Criar documentos Word (.docx) | claude-code (skill: docx) |
| Criar apresentacoes PowerPoint | claude-code (skill: pptx) |
| Criar/editar PDFs | claude-code (skill: pdf) |
| Criar/analisar planilhas Excel | claude-code (skill: xlsx) |
| Criar landing pages / sites | claude-code (skill: web-artifacts-builder) |
| Criar design visual / imagens | claude-code (skill: canvas-design) |
| Aplicar identidade visual da marca | claude-code (skill: brand-guidelines) |
| Escrever comunicados/newsletters | claude-code (skill: internal-comms) |
| Criar apresentacoes HTML animadas | claude-code (skill: frontend-slides) |
| Gerar copies de anuncio | claude-code (skill: ad-copy) |
| Criar roteiros de video/reels | claude-code (skill: video-script) |
| Montar calendario de conteudo | claude-code (skill: content-calendar) |
| Criar proposta comercial | claude-code (skill: commercial-proposal) |
| Criar sequencia de emails | claude-code (skill: email-sequence) |
| Analisar concorrentes | claude-code (skill: competitor-analysis) |
| Criar posts para redes sociais | claude-code (skill: social-media-post) |
| Criar conteudo SEO | claude-code (skill: seo-content) |
| Criar landing page | claude-code (skill: landing-page) |
| Gerar relatorios | claude-code (skill: report-generator) |
| Auditar campanhas de anuncios | claude-code (skill: claude-ads) |
| Executar codigo (Python, shell) | claude-code |
| Git (commit, push, pull) | claude-code |
| Instalar pacotes, configurar ferramentas | claude-code |
| Criar automacoes ou workflows | claude-code |
| Criar novos skills | claude-code (skill: skill-creator) |

Skills instalados (~30): docx, pdf, pptx, xlsx, canvas-design, frontend-design, web-artifacts-builder, brand-guidelines, internal-comms, doc-coauthoring, skill-creator, algorithmic-art, theme-factory, slack-gif-creator, claude-ads (auditoria de anuncios), ad-copy, video-script, content-calendar, commercial-proposal, email-sequence, competitor-analysis, social-media-post, seo-content, landing-page, report-generator, frontend-slides.

IMPORTANTE: Nunca pergunte ao usuario qual ferramenta usar. Decida automaticamente. Se a tarefa envolve gerar arquivos (Word, PDF, Excel, PowerPoint, HTML, imagens), SEMPRE use claude-code — ele tem skills especializados pra isso.

## Onde salvar arquivos gerados

Todo arquivo gerado por skills DEVE ser salvo na pasta Documentos (DOCS_PATH).

Logica de destino:
1. Se o usuario mencionou um cliente/projeto → Consultorias/{cliente}/
2. Se mencionou uma venture → Ventures/{projeto}/
3. Se e generico → _Gerados/

Subpastas por tipo:
- Documentos (docx, pdf) → {destino}/documentos/
- Apresentacoes (pptx, html) → {destino}/apresentacoes/
- Planilhas (xlsx, csv) → {destino}/planilhas/
- Web (landing pages) → {destino}/web/
- Marketing (copies, calendarios) → {destino}/marketing/
- Imagens/Design → {destino}/design/

APOS gerar: informe o caminho completo, mostre conteudo inline se HTML, pergunte se quer ajustes.

Ao usar claude-code, SEMPRE inclua no prompt o caminho absoluto de DOCS_PATH e o destino do arquivo.

## Regras para o Claude

- Ao processar arquivos de Downloads, identificar o contexto e direcionar para a pasta correta
- Sempre usar os templates de `_templates/` ao gerar documentos de knowledge
- Atualizar os indices em `_overview/` apos qualquer processamento
- Nunca misturar arquivos entre projetos
- Preservar edicoes manuais existentes em arquivos de knowledge

## Fluxo de processamento

Downloads/ (inbox natural) > Identificar contexto > knowledge/ > processed/ > _overview/

## Como processar documentos

No Claude Desktop (Cowork), dizer:
"processe os arquivos novos de Downloads"

O Claude vai ler os arquivos via MCP filesystem, gerar resumos estruturados em knowledge/, mover originais para processed/ e atualizar os indices.

## Templates disponiveis em _templates/

- contract.md — para contratos
- meeting.md — para reunioes
- decision.md — para decisoes
- client_profile.md — para perfis de clientes
```

## 5. Copiar templates

Copie os arquivos de templates/ deste repositorio para DOCS_PATH/Consultorias/_templates/

Os templates sao:
- contract.md
- meeting.md
- decision.md
- client_profile.md

Nao sobrescrever templates que ja existam.

## 6. Criar indices em _overview/

Criar estes arquivos em DOCS_PATH/Consultorias/_overview/ (se nao existirem):

### clients_index.md
```
# Indice de Clientes

Ultima atualizacao: [data de hoje]

(Nenhum cliente cadastrado ainda. Processe documentos para popular este indice.)
```

### pending_actions.md
```
# Acoes Pendentes

Ultima atualizacao: [data de hoje]

(Nenhuma acao pendente.)
```

## 7. Instalar MCP server do Claude Code

O repositorio inclui um servidor MCP proprio em `mcp-server/`. Instale as dependencias:

```
cd REPO_PATH/mcp-server && npm install
```

Aguarde a instalacao completar. Se falhar, tente novamente.

## 8. Instalar skills oficiais

Skills sao arquivos .md que ensinam o Claude Code a executar tarefas especializadas (criar PDFs, PowerPoints, landing pages, etc). Sao auto-descobertos em ~/.claude/skills/.

### 8a. Clonar repositorio oficial da Anthropic

```
cd /tmp && git clone --depth 1 https://github.com/anthropics/skills.git anthropic-skills 2>/dev/null || true
```

### 8b. Copiar todos os skills oficiais

```
mkdir -p ~/.claude/skills
cp -r /tmp/anthropic-skills/skills/* ~/.claude/skills/
```

Isso instala os 17 skills oficiais da Anthropic.

### 8c. Instalar claude-ads (auditoria de anuncios)

```
cd /tmp && git clone --depth 1 https://github.com/AgriciDaniel/claude-ads.git 2>/dev/null || true
cp -r /tmp/claude-ads/skills/* ~/.claude/skills/ 2>/dev/null || true
mkdir -p ~/.claude/agents
cp -r /tmp/claude-ads/agents/* ~/.claude/agents/ 2>/dev/null || true
```

### 8d. Criar skills de marketing e negocios

Crie cada pasta e SKILL.md abaixo em ~/.claude/skills/:

**ad-copy/SKILL.md:**
```
---
name: ad-copy
description: Gera variacoes de copy para anuncios (Meta Ads, Google Ads, LinkedIn Ads)
autoContext: false
---
Ao criar copies de anuncio:
1. Pergunte: produto/servico, publico-alvo, objetivo (vendas, leads, awareness), plataforma
2. Gere pelo menos 5 variacoes com abordagens diferentes (dor, beneficio, prova social, urgencia, curiosidade)
3. Para cada variacao inclua: titulo (max 40 chars), texto principal (max 125 chars para Meta), descricao, CTA
4. Respeite os limites de caracteres de cada plataforma
5. Sugira emojis quando apropriado para Meta/Instagram
6. Ao final, recomende as 2 melhores para teste A/B e explique por que
```

**video-script/SKILL.md:**
```
---
name: video-script
description: Cria roteiros de video para Reels, TikTok, YouTube e videos institucionais
autoContext: false
---
Ao criar roteiros:
1. Pergunte: formato (reels 30-60s, YouTube, institucional), objetivo, tom de voz
2. Estruture com: HOOK (primeiros 3 segundos), DESENVOLVIMENTO, CTA
3. Inclua colunas: TEMPO | VISUAL | AUDIO | TEXTO NA TELA
4. Para Reels/TikTok: hooks que prendem nos primeiros 3 segundos, max 60 segundos
5. Para YouTube: intro, capitulos, CTA no meio e no final
6. Sugira trilha sonora e efeitos visuais
7. Marque momentos de corte e transicao
```

**content-calendar/SKILL.md:**
```
---
name: content-calendar
description: Cria calendario editorial para redes sociais e conteudo
autoContext: false
---
Ao criar calendarios:
1. Pergunte: plataformas, frequencia, temas principais, periodo
2. Gere arquivo Excel (.xlsx) com: Data, Dia, Plataforma, Formato, Tema, Copy, Hashtags, Status
3. Distribua pilares de conteudo uniformemente
4. Inclua datas comemorativas relevantes do periodo
5. Varie formatos: carrossel, reels, stories, post estatico, video
6. Sugira horarios de publicacao por plataforma
```

**commercial-proposal/SKILL.md:**
```
---
name: commercial-proposal
description: Cria propostas comerciais profissionais em PDF
autoContext: false
---
Ao criar propostas:
1. Pergunte: empresa, cliente, servico/produto, valores, prazo, diferenciais
2. Estruture: Capa, Sobre Nos, Diagnostico, Solucao Proposta, Escopo, Cronograma, Investimento, Termos, Proximo Passo
3. Use o skill pdf para gerar o documento final
4. Inclua tabela de precos com opcoes quando aplicavel
5. Destaque ROI e beneficios, nao features
6. Termine com CTA claro e dados de contato
```

**email-sequence/SKILL.md:**
```
---
name: email-sequence
description: Cria sequencias de email marketing para lancamentos, nurturing e vendas
autoContext: false
---
Ao criar sequencias:
1. Pergunte: objetivo (lancamento, nurturing, vendas, onboarding), produto, publico
2. Crie 5-7 emails com intervalo sugerido entre cada
3. Para cada email: Assunto (max 50 chars), Preview text, Corpo, CTA
4. Lancamento: Antecipacao > Valor > Oferta > Prova social > Urgencia > Ultimo dia
5. Nurturing: Boas-vindas > Problema > Solucao > Case > Conteudo > Oferta soft
6. Use copywriting (PAS, AIDA) e storytelling
```

**competitor-analysis/SKILL.md:**
```
---
name: competitor-analysis
description: Analisa concorrentes e gera relatorio comparativo
autoContext: false
---
Ao analisar concorrentes:
1. Pergunte: empresa do usuario, 3-5 concorrentes, criterios importantes
2. Estruture: Posicionamento, Precos, Canais, Mensagem, Pontos Fortes, Pontos Fracos
3. Crie matriz comparativa em tabela
4. Identifique gaps e oportunidades
5. Gere relatorio em PDF ou Excel
6. Inclua recomendacoes acionaveis com prioridade
```

**social-media-post/SKILL.md:**
```
---
name: social-media-post
description: Cria posts otimizados para Instagram, LinkedIn, Twitter/X e Facebook
autoContext: false
---
Ao criar posts:
1. Pergunte: plataforma, objetivo, tema, tom de voz
2. Adapte para cada plataforma:
   - Instagram: visual-first, hashtags (20-30), emojis, carrossel ou single
   - LinkedIn: profissional, storytelling, 3-5 hashtags
   - Twitter/X: conciso (280 chars), thread se necessario
   - Facebook: conversacional, perguntas, compartilhavel
3. Inclua: texto, sugestao de imagem, hashtags, melhor horario
4. Para carrosseis: roteiro de cada slide (capa, slides, CTA final)
5. Gere 3 variacoes para teste
```

**seo-content/SKILL.md:**
```
---
name: seo-content
description: Cria conteudo otimizado para SEO (artigos, blog posts, paginas)
autoContext: false
---
Ao criar conteudo SEO:
1. Pergunte: palavra-chave principal, secundarias, publico, objetivo
2. Inclua: Title tag (max 60 chars), Meta description (max 155 chars), H1, H2s, H3s
3. Palavra-chave no titulo, primeiro paragrafo, e distribuida naturalmente
4. Paragrafos curtos (2-3 frases), listas e bullet points
5. Minimo 1500 palavras para artigos, 800 para paginas
6. Sugira alt text para imagens
```

**landing-page/SKILL.md:**
```
---
name: landing-page
description: Cria landing pages completas otimizadas para conversao
autoContext: false
---
Ao criar landing pages:
1. Pergunte: produto/servico, publico-alvo, objetivo, tom
2. Use web-artifacts-builder para gerar HTML + Tailwind CSS
3. Secoes: Hero (headline + CTA acima da dobra), Problema, Solucao, Beneficios (3-4 com icones), Prova social, Como funciona (3 passos), FAQ (4-6), CTA final
4. Design responsivo mobile-first
5. Micro-interacoes (hover, scroll animations CSS)
6. Arquivo .html auto-contido e funcional
```

**report-generator/SKILL.md:**
```
---
name: report-generator
description: Gera relatorios profissionais a partir de dados, notas ou reunioes
autoContext: false
---
Ao gerar relatorios:
1. Pergunte: tipo (mensal, trimestral, projeto, reuniao), dados, publico
2. Estruture: Resumo Executivo, Contexto, Dados/Analise, Insights, Recomendacoes, Proximos Passos
3. Use graficos e tabelas quando houver dados numericos
4. Gere em PDF ou Word conforme preferencia
5. Resumo executivo em 1 pagina
6. Use bullet points e destaque numeros importantes
```

### 8e. Criar skill de apresentacoes HTML

```
mkdir -p ~/.claude/skills/frontend-slides
```

Crie ~/.claude/skills/frontend-slides/SKILL.md:
```
---
name: frontend-slides
description: Cria apresentacoes HTML animadas e responsivas
autoContext: false
---
Ao criar apresentacoes:
1. Use HTML5 + CSS3 + JavaScript puro
2. Slides como secoes com transicoes suaves
3. Navegacao por setas do teclado e clique
4. Design moderno com gradientes, sombras e tipografia limpa
5. Arquivo .html unico auto-contido
6. Responsivo (tela cheia e mobile)
```

### 8f. Limpar repos temporarios

```
rm -rf /tmp/anthropic-skills /tmp/claude-ads
```

Conte quantos skills foram instalados em ~/.claude/skills/ e informe o total.

## 9. Configurar MCPs no Claude Desktop

### 9a. Localizar arquivo de configuracao

- Windows (Microsoft Store): procure em AppData/Local/Packages/ por pasta que comece com "Claude_" e dentro dela LocalCache/Roaming/Claude/claude_desktop_config.json
  - Use: find /c/Users/*/AppData/Local/Packages/Claude_*/LocalCache/Roaming/Claude/ -name "claude_desktop_config.json" 2>/dev/null
- Windows (instalacao classica): ~/AppData/Roaming/Claude/claude_desktop_config.json
- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

Se o arquivo existir, leia o conteudo atual e PRESERVE TUDO que ja existe (preferences, outros mcpServers, etc). Apenas adicione ou atualize os servidores MCP abaixo.

### 9b. Converter caminhos para formato do SO

Todos os caminhos no JSON precisam estar no formato do SO:
- **Windows**: barras invertidas duplas. Converter DOCS_PATH, DOWNLOADS_PATH, NODE_PATH e REPO_PATH.
  Exemplo: `/c/Users/leona/OneDrive/Documentos` → `C:\\Users\\leona\\OneDrive\\Documentos`
  Exemplo: `/c/Program Files/nodejs` → `C:\\Program Files\\nodejs`
- **macOS**: barras normais, sem conversao necessaria.

Guarde os caminhos convertidos como DOCS_WIN, DOWNLOADS_WIN, NODE_WIN, REPO_WIN (ou equivalente Mac).

### 9c. Escrever configuracao com caminhos dinamicos

Adicione/atualize a secao mcpServers com DOIS servidores.
Use os caminhos detectados — NUNCA use caminhos fixos.

**MCP 1: filesystem** — Claude Desktop le/escreve arquivos:
- command: `NODE_WIN\\npx.cmd` (Windows) ou `npx` (macOS)
- args: `["-y", "@modelcontextprotocol/server-filesystem", "DOCS_WIN", "DOWNLOADS_WIN"]`

**MCP 2: claude-code** — Cowork aciona o Claude Code:
- command: `NODE_WIN\\node.exe` (Windows) ou `node` (macOS)
- args: `["REPO_WIN\\mcp-server\\index.mjs"]`

Exemplo Windows (substituir pelos valores reais detectados):
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "NODE_WIN\\npx.cmd",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "DOCS_WIN",
        "DOWNLOADS_WIN"
      ]
    },
    "claude-code": {
      "command": "NODE_WIN\\node.exe",
      "args": [
        "REPO_WIN\\mcp-server\\index.mjs"
      ]
    }
  }
}
```

Exemplo macOS (substituir pelos valores reais detectados):
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "DOCS_PATH", "DOWNLOADS_PATH"]
    },
    "claude-code": {
      "command": "node",
      "args": ["REPO_PATH/mcp-server/index.mjs"]
    }
  }
}
```

IMPORTANTE: Preserve qualquer configuracao existente no arquivo (preferences, localAgentModeTrustedFolders, etc). Apenas adicione/atualize os mcpServers.

## 10. Configurar Cowork trusted folders

No mesmo arquivo de configuracao do Claude Desktop, verifique se existe a secao preferences.localAgentModeTrustedFolders. Se existir, adicione DOCS_PATH a lista (se nao estiver la). Se nao existir, crie:

```json
{
  "preferences": {
    "localAgentModeTrustedFolders": [
      "DOCS_PATH_AQUI_COM_BARRAS_DO_SO"
    ]
  }
}
```

Isso permite que o Cowork trabalhe diretamente na pasta Documentos sem pedir permissao toda vez.

## 11. Configurar permissoes do Claude Code

Verifique se existe ~/.claude/settings.json. Se existir, leia e preserve. Adicione/atualize as permissoes para incluir:

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch"
    ]
  }
}
```

## 12. Validacao final

Execute as seguintes verificacoes e marque cada uma:
- [ ] Node.js instalado (node --version)
- [ ] Caminho do Node.js detectado (NODE_PATH)
- [ ] Pasta Documentos encontrada e acessivel
- [ ] Estrutura de pastas criada (Consultorias, Ventures, Metodos, _Misc)
- [ ] CLAUDE.md existe na raiz de Documentos
- [ ] Templates copiados para _templates/ (4 arquivos)
- [ ] Indices criados em _overview/ (2 arquivos)
- [ ] MCP server instalado (npm install em mcp-server/)
- [ ] Skills instalados em ~/.claude/skills/ (~30 skills)
- [ ] MCP filesystem configurado no Claude Desktop (com caminhos dinamicos)
- [ ] MCP claude-code configurado no Claude Desktop (com caminhos dinamicos)
- [ ] Trusted folders configurado para Cowork
- [ ] Permissoes do Claude Code configuradas

## 13. Mostrar resumo

Apresente um resumo claro do que foi feito:

```
=============================================
  SETUP CONCLUIDO COM SUCESSO!
=============================================

Sistema operacional: [SO]
Pasta Documentos: [caminho]
Node.js: [versao]

O que foi configurado:
  - Estrutura de pastas do segundo cerebro
  - CLAUDE.md (contexto permanente para a IA)
  - Templates padrao (contrato, reuniao, decisao, perfil)
  - ~30 skills prontos (documentos, design, landing pages,
    ads, roteiros, email marketing, SEO, social media, e mais)
  - MCP filesystem (Claude Desktop le/escreve seus arquivos)
  - MCP claude-code (Cowork pode acionar o Claude Code)
  - Roteamento automatico (skills-first)
  - Trusted folders (Cowork trabalha sem pedir permissao)
  - Permissoes do Claude Code (executa sem interrupcoes)

=============================================
  PROXIMO PASSO
=============================================

1. Feche e reabra o Claude Desktop

2. Teste no Claude Desktop:
   "liste os arquivos da minha pasta Documentos"
   Se listar, esta tudo funcionando!

3. Experimente pedir (tudo pelo Claude Desktop):
   - "cria uma apresentacao sobre [tema]"
   - "faz uma landing page pro meu produto"
   - "analisa essa planilha" (arraste o arquivo)
   - "cria uma proposta comercial em PDF"
   - "gera 5 variacoes de copy pra um anuncio"
   - "cria um roteiro de video de 60 segundos"

4. Para processar documentos:
   "processe os arquivos novos de Downloads"

DICA: Use o Cowork para tarefas mais longas.
      Ele trabalha em background enquanto voce faz outras coisas.

Voce NAO precisa abrir o terminal no dia a dia.
Tudo e feito pelo Claude Desktop / Cowork.

Skills instalados (~30, o Claude usa automaticamente):

  Documentos: docx, pdf, pptx, xlsx
  Design: canvas-design, frontend-design, brand-guidelines, theme-factory
  Web: web-artifacts-builder, landing-page, frontend-slides
  Marketing: ad-copy, social-media-post, seo-content, content-calendar
  Video: video-script
  Comunicacao: internal-comms, email-sequence, doc-coauthoring
  Negocios: commercial-proposal, report-generator, competitor-analysis
  Ads: claude-ads + 12 sub-skills (Meta, Google, YouTube, etc.)
  Meta: skill-creator (cria novos skills sob demanda)
=============================================
```
