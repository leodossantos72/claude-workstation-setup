Voce e um agente de setup. Execute TODOS os passos abaixo em sequencia.
Ao final de cada passo, informe o que foi feito. Se algo falhar, informe o erro e tente uma alternativa.

IMPORTANTE: Todos os caminhos sao detectados dinamicamente. NUNCA use caminhos hardcoded.
Guarde tudo em variaveis mentais para reutilizar nos passos seguintes.

## Pre-requisitos do mentorado

Antes de rodar este setup, o mentorado precisa ter:
- Claude Desktop instalado (com Cowork/Agent ativo)
- Claude Code CLI instalado (`claude --version` funciona)
- Conta Anthropic com API key configurada
- Git instalado (`git --version` funciona)
- Conexao com internet

O setup instala automaticamente:
- Node.js (se nao tiver)
- Todas as dependencias npm (chokidar, agent-sdk)
- Skills, templates, MCPs, watcher, auto-start

## 1. Detectar ambiente e verificar pre-requisitos

### 1a. Detectar SO e caminhos

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

### 1b. Verificar pre-requisitos (PARE se falhar)

Execute TODOS estes checks. Se QUALQUER um falhar, informe o mentorado e PARE:

```
git --version       # deve retornar versao
claude --version    # Claude Code CLI deve estar instalado
```

Se `git` nao existir:
- Windows: `winget install Git.Git --accept-source-agreements --accept-package-agreements`
- macOS: `xcode-select --install`

Se `claude` nao existir: instrua o mentorado a instalar em https://docs.anthropic.com/en/docs/claude-code

Apos instalar, VERIFIQUE novamente que funciona antes de continuar.

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

## 3. Escanear e indexar estrutura de Documentos

### 3a. Criar pastas auxiliares

Dentro de DOCS_PATH, crie APENAS estas pastas (nao sobrescrever o que ja existe):

```
_knowledge/
_gerados/
```

- `_knowledge/` — memoria da IA: indice da estrutura, contexto de projetos, resumos processados
- `_gerados/` — destino padrao para arquivos gerados quando nao ha contexto de projeto

### 3b. Gerar indice da estrutura existente

Liste TODAS as pastas e subpastas de DOCS_PATH (ate 2 niveis de profundidade). Gere o arquivo DOCS_PATH/_knowledge/index.md com este formato:

```
# Indice do Workspace

Ultima atualizacao: [data de hoje]

## Estrutura de pastas

[liste todas as pastas encontradas com uma breve descricao do que parecem conter, baseado nos nomes e arquivos dentro delas]

Exemplo:
- `Projetos/ClienteX/` — [descricao baseada nos arquivos encontrados]
- `Financeiro/` — [descricao]
- `Pessoal/` — [descricao]

## Projetos/contextos identificados

[liste projetos, clientes ou contextos que voce conseguiu identificar pela estrutura]

## Arquivos recentes

[liste os 10 arquivos mais recentes encontrados com caminho e data]
```

IMPORTANTE: Respeite 100% a estrutura que o usuario ja tem. NAO crie pastas de organizacao (como Consultorias/, Ventures/, etc) — use o que ja existe. O indice serve para o Claude conhecer e navegar a estrutura do usuario, nao para impor uma nova.

## 4. Detectar pasta Desktop

Detecte a pasta Desktop do usuario:
- Windows com OneDrive: ~/OneDrive/Desktop ou ~/OneDrive/Área de Trabalho
- Windows local: ~/Desktop ou ~/Área de Trabalho
- macOS: ~/Desktop

Guarde como DESKTOP_PATH. Esta pasta sera a base de trabalho do Cowork.

## 5. Copiar templates

Copie os arquivos de templates/ deste repositorio para DOCS_PATH/_knowledge/templates/

Os templates sao:
- contract.md
- meeting.md
- decision.md
- client_profile.md

Nao sobrescrever templates que ja existam.

## 6. Instalar MCP server do Claude Code

O repositorio inclui um servidor MCP proprio em `mcp-server/`. Instale as dependencias:

```
cd REPO_PATH/mcp-server && npm install
```

Aguarde a instalacao completar. Se falhar, tente novamente.

## 7. Instalar skills oficiais

Skills sao arquivos .md que ensinam o Claude Code a executar tarefas especializadas (criar PDFs, PowerPoints, landing pages, etc). Sao auto-descobertos em ~/.claude/skills/.

### 7a. Clonar repositorio oficial da Anthropic

```
cd /tmp && git clone --depth 1 https://github.com/anthropics/skills.git anthropic-skills 2>/dev/null || true
```

### 7b. Copiar todos os skills oficiais

```
mkdir -p ~/.claude/skills
cp -r /tmp/anthropic-skills/skills/* ~/.claude/skills/
```

Isso instala os 17 skills oficiais da Anthropic.

### 7c. Instalar claude-ads (auditoria de anuncios)

```
cd /tmp && git clone --depth 1 https://github.com/AgriciDaniel/claude-ads.git 2>/dev/null || true
cp -r /tmp/claude-ads/skills/* ~/.claude/skills/ 2>/dev/null || true
mkdir -p ~/.claude/agents
cp -r /tmp/claude-ads/agents/* ~/.claude/agents/ 2>/dev/null || true
```

### 7d. Criar skills de marketing e negocios

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

### 7e. Criar skill de apresentacoes HTML

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

### 7f. Limpar repos temporarios

```
rm -rf /tmp/anthropic-skills /tmp/claude-ads
```

Conte quantos skills foram instalados em ~/.claude/skills/ e informe o total.

## 8. Configurar MCPs no Claude Desktop

### 8a. Localizar arquivo de configuracao

- Windows (Microsoft Store): procure em AppData/Local/Packages/ por pasta que comece com "Claude_" e dentro dela LocalCache/Roaming/Claude/claude_desktop_config.json
  - Use: find /c/Users/*/AppData/Local/Packages/Claude_*/LocalCache/Roaming/Claude/ -name "claude_desktop_config.json" 2>/dev/null
- Windows (instalacao classica): ~/AppData/Roaming/Claude/claude_desktop_config.json
- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

Se o arquivo existir, leia o conteudo atual e PRESERVE TUDO que ja existe (preferences, outros mcpServers, etc). Apenas adicione ou atualize os servidores MCP abaixo.

### 8b. Converter caminhos para formato do SO

Todos os caminhos no JSON precisam estar no formato do SO:
- **Windows**: barras invertidas duplas. Converter DOCS_PATH, DOWNLOADS_PATH, NODE_PATH e REPO_PATH.
  Exemplo: `/c/Users/leona/OneDrive/Documentos` → `C:\\Users\\leona\\OneDrive\\Documentos`
  Exemplo: `/c/Program Files/nodejs` → `C:\\Program Files\\nodejs`
- **macOS**: barras normais, sem conversao necessaria.

Guarde os caminhos convertidos como DOCS_WIN, DOWNLOADS_WIN, NODE_WIN, REPO_WIN (ou equivalente Mac).

### 8c. Escrever configuracao com caminhos dinamicos

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

## 9. Configurar Cowork trusted folders

No mesmo arquivo de configuracao do Claude Desktop, verifique se existe a secao preferences.localAgentModeTrustedFolders. Se existir, adicione DESKTOP_PATH e DOCS_PATH a lista (se nao estiverem la). Se nao existir, crie (DESKTOP_PATH ja foi detectado no passo 4):

```json
{
  "preferences": {
    "localAgentModeTrustedFolders": [
      "DESKTOP_PATH_AQUI_COM_BARRAS_DO_SO",
      "DOCS_PATH_AQUI_COM_BARRAS_DO_SO"
    ]
  }
}
```

Isso permite que o Cowork trabalhe nas pastas Desktop e Documentos sem pedir permissao.

## 10. Configurar permissoes do Claude Code

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

## 11. Criar CLAUDE.md na pasta Desktop (para Cowork)

O Cowork le o CLAUDE.md da pasta de trabalho selecionada. Este arquivo contem TODAS as instrucoes de comportamento do Cowork: quando usar cada MCP, onde salvar arquivos, comportamento proativo com Downloads, etc.

Crie DESKTOP_PATH/CLAUDE.md (ja detectado no passo 4) com este conteudo:

```
# Assistente de Trabalho

Voce e o assistente de produtividade do usuario. Trabalha no Claude Desktop (Cowork) com acesso a dois MCPs poderosos.

## Ferramentas disponiveis

Voce tem dois MCPs. Use o correto automaticamente, NUNCA pergunte qual usar:

**filesystem** — ler, escrever, listar, mover arquivos nas pastas Documentos e Downloads
**claude-code** (tool: task) — executar codigo, rodar skills especializados, gerar documentos complexos

## Quando usar cada um

| Tarefa | Usar |
|--------|------|
| Ler/listar/mover arquivos | filesystem |
| Criar resumos de texto simples | filesystem |
| Criar Word (.docx), PDF, PowerPoint, Excel | claude-code |
| Criar landing pages, sites HTML | claude-code |
| Criar design visual, imagens | claude-code |
| Gerar copies de anuncio | claude-code |
| Criar roteiros de video | claude-code |
| Montar calendario de conteudo | claude-code |
| Criar propostas comerciais | claude-code |
| Criar sequencias de email | claude-code |
| Analisar concorrentes | claude-code |
| Criar posts para redes sociais | claude-code |
| Criar conteudo SEO | claude-code |
| Auditar campanhas de anuncios | claude-code |
| Gerar relatorios com graficos | claude-code |
| Executar codigo (Python, shell) | claude-code |
| Qualquer geracao de arquivo complexo | claude-code |

REGRA: Se a tarefa envolve GERAR arquivos (Word, PDF, Excel, PowerPoint, HTML, imagens, graficos), SEMPRE use claude-code. Ele tem ~30 skills especializados pra isso.

## Knowledge base — como conhecer o workspace do usuario

O arquivo `Documentos/_knowledge/index.md` contem o mapa completo da estrutura de pastas e o contexto de cada projeto/pasta do usuario. SEMPRE consulte este arquivo antes de tomar decisoes sobre onde salvar arquivos ou a qual projeto um documento pertence.

Se o index.md nao existir ou estiver desatualizado, liste a pasta Documentos via filesystem e reconstrua o indice.

## Onde salvar arquivos gerados

Ao usar claude-code para gerar arquivos, SEMPRE passe o destino correto:

1. Consulte `_knowledge/index.md` para entender a estrutura do usuario
2. Se o usuario mencionou um projeto/cliente/contexto → encontre a pasta correspondente no indice
3. Se nao ha correspondencia clara → salve em `Documentos/_gerados/`
4. Se nao tem certeza → PERGUNTE ao usuario onde salvar

Apos salvar, atualize o `_knowledge/index.md` se necessario.

## Apos gerar arquivos

1. Leia o arquivo gerado via filesystem MCP
2. HTML → mostre o conteudo inline
3. Imagem → leia e mostre
4. DOCX/PPTX/XLSX/PDF → informe o caminho: "Abra o arquivo para visualizar"
5. SEMPRE pergunte se quer ajustes

Para graficos e visualizacoes: peca ao claude-code para gerar como HTML auto-contido com Chart.js (NAO PNG).

Ao chamar claude-code, SEMPRE inclua no prompt:
- O caminho absoluto da pasta Documentos como cwd
- O destino especifico do arquivo (caminho completo)
- "Gere visualizacoes como HTML auto-contido com Chart.js embutido"

## Comportamento proativo com Downloads

NOTA: O Watcher automatico ja monitora Downloads e processa arquivos novos em background. Se o usuario pedir explicitamente para processar um arquivo, siga o fluxo abaixo. Caso contrario, o watcher ja fez o trabalho.

Quando o usuario mencionar que baixou, recebeu ou tem um arquivo novo:
1. Verifique se o watcher ja processou (consulte `_knowledge/topics/` e `_knowledge/index.md`)
2. Se ja tem topic → informe ao usuario o que o watcher encontrou
3. Se ainda nao processou, faca manualmente:
   a. Liste a pasta Downloads via filesystem MCP
   b. Leia o CONTEUDO COMPLETO do arquivo
   c. Identifique o contexto pelo CONTEUDO, NUNCA pelo nome do arquivo
   d. Consulte `_knowledge/index.md` para encontrar a pasta/projeto correspondente
   e. Se nao encontrar correspondencia, PERGUNTE ao usuario
   f. Processe: gere resumo, organize na pasta correta

IMPORTANTE: NUNCA use o nome do arquivo para decidir o projeto/cliente. Sempre leia o conteudo primeiro.

Gatilhos: "baixei", "fiz download", "recebi um arquivo", "tem um documento novo", "peguei um PDF", "salvei um arquivo"

## Persistencia proativa de conhecimento

DURANTE a conversa (nao espere o final), persista informacoes importantes:

1. **Decisoes**: Quando o usuario tomar uma decisao relevante (ex: "vamos usar X", "o cliente quer Y"), IMEDIATAMENTE atualize o topic correspondente em `_knowledge/topics/`
2. **Novos fatos**: Quando o usuario mencionar um fato novo sobre um projeto/cliente, atualize o knowledge
3. **Preferencias**: Quando o usuario expressar uma preferencia de trabalho, registre em `_knowledge/topics/preferencias.md`

Use filesystem MCP para escrever diretamente nos topics. NAO acumule para o final da conversa — a sessao pode ser encerrada ou compactada a qualquer momento.

Se um topic nao existir ainda, crie-o. Se existir, atualize (nao sobrescreva — adicione a nova informacao).

## Busca no knowledge

O watcher tem busca full-text sobre os topics. Se precisar encontrar informacao especifica no knowledge, use claude-code para buscar:
```
node REPO_PATH/watcher/index.mjs --search "palavra-chave"
```
Suporta multiplas palavras (todas devem aparecer no topic).

## Regras gerais

- Nunca pergunte qual ferramenta usar — decida automaticamente
- Nunca misture arquivos entre projetos
- Sempre consulte `_knowledge/index.md` antes de decidir onde salvar
- Atualize o indice apos qualquer processamento ou geracao de arquivo
- Preserve edicoes manuais em arquivos existentes
- Responda em portugues brasileiro

## Privacidade

Arquivos processados pelo watcher e pelo Cowork sao enviados via API para a Anthropic. NAO coloque documentos confidenciais, sensiveis ou com dados pessoais de terceiros na estrutura monitorada. Se necessario, crie uma pasta com arquivo `.nowatcher` dentro para excluir do monitoramento automatico.
```

## 12. Instalar e configurar o Watcher

O watcher monitora as pastas Documentos e Downloads. Quando detecta arquivos novos ou editados, chama o Claude Code via Agent SDK para ler o conteudo, criar knowledge em `_knowledge/topics/`, e organizar arquivos na estrutura existente. Tambem tem busca full-text sobre o knowledge.

### 12a. Instalar dependencias do watcher

```
cd REPO_PATH/watcher && npm install
```

### 12b. Configurar auto-start com o sistema

O watcher deve iniciar automaticamente quando o usuario liga o computador.

**Windows:**

Crie um arquivo .vbs (Visual Basic Script) que inicia o watcher sem janela visivel:

1. Crie o arquivo `REPO_PATH/watcher/start-watcher.vbs` com o conteudo:
```vbs
Set objShell = CreateObject("WScript.Shell")
objShell.Run """NODE_WIN\node.exe"" ""REPO_WIN\watcher\index.mjs"" ""DOCS_WIN""", 0, False
```
(substitua NODE_WIN, REPO_WIN e DOCS_WIN pelos caminhos Windows detectados)

2. Crie um atalho deste .vbs na pasta Startup do Windows:
```
cp "REPO_PATH/watcher/start-watcher.vbs" "$APPDATA/Microsoft/Windows/Start Menu/Programs/Startup/claude-watcher.vbs"
```

**macOS:**

Crie um LaunchAgent para iniciar automaticamente:

1. Crie o arquivo `~/Library/LaunchAgents/com.claude.watcher.plist` com:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.watcher</string>
    <key>ProgramArguments</key>
    <array>
        <string>NODE_PATH/node</string>
        <string>REPO_PATH/watcher/index.mjs</string>
        <string>DOCS_PATH</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/claude-watcher.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/claude-watcher.log</string>
</dict>
</plist>
```
(substitua NODE_PATH, REPO_PATH e DOCS_PATH pelos caminhos reais detectados)

2. Carregue o agente:
```
launchctl load ~/Library/LaunchAgents/com.claude.watcher.plist
```

### 12c. Verificar que o watcher esta rodando

Inicie o watcher manualmente para a sessao atual (o auto-start vai cuidar das proximas vezes):

```
cd REPO_PATH/watcher && node index.mjs "DOCS_PATH" &
```

Verifique que o `_knowledge/index.md` foi gerado/atualizado.

## 13. Configurar Cowork Autofix (Windows)

APENAS no Windows. No macOS, pule para o passo 14.

O Cowork no Windows usa uma VM Hyper-V que depende de uma rede virtual (HNS). O Windows perde essa rede com frequencia (apos sleep, updates, mudancas de rede), causando "Request timed out" ao abrir o Cowork. Este passo instala um fix automatico que previne o problema.

O fix funciona assim:
- Uma tarefa agendada SYSTEM roda a cada 5 minutos + no boot + no logon
- O script verifica se a rede HNS existe. Se sim, sai em <1 segundo (zero impacto)
- Se a rede sumiu, recria automaticamente e reinicia o servico
- O mentorado NUNCA precisa fazer nada — e 100% invisivel

### 13a. Copiar scripts

```
powershell.exe -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
mkdir -p ~/scripts
cp REPO_PATH/scripts/fix-cowork.ps1 ~/scripts/fix-cowork.ps1
cp REPO_PATH/scripts/register-task.ps1 ~/scripts/register-task.ps1
```

O modulo HNS e instalado automaticamente pelo register-task.ps1 (como admin, para todos os usuarios incluindo SYSTEM).

### 13b. Registrar tarefa agendada (requer elevacao — unica vez)

IMPORTANTE: ANTES de executar o comando abaixo, AVISE o mentorado com esta mensagem EXATA:

---
**Atencao:** Vou configurar uma protecao automatica para o Cowork.
Vai aparecer uma janela do Windows pedindo permissao de administrador.
**Clique em SIM** para autorizar. E a unica vez que isso vai aparecer.
---

AGUARDE o mentorado confirmar que entendeu (ou pelo menos 3 segundos) antes de executar.

O register-task.ps1 cria uma tarefa SYSTEM que roda a cada 5 min, no boot e no logon.

```
powershell.exe -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File REPO_PATH_WIN\scripts\register-task.ps1' -Wait"
```

(Substitua REPO_PATH_WIN pelo caminho Windows do repositorio, com barras invertidas)

Verifique o resultado:
```
cat ~/scripts/register-task.result
```

Se contiver "OK", a tarefa foi registrada com sucesso. Informe: "Protecao do Cowork ativada com sucesso!"
Se contiver "ERRO", informe o erro ao mentorado e sugira rodar manualmente depois.
Se o mentorado negar o UAC, NAO insista. Informe que pode fazer depois rodando: `powershell -ExecutionPolicy Bypass -File scripts/setup-cowork-autofix.ps1`

### 13c. Copiar atalho de emergencia para o Desktop

O .bat usa auto-elevacao para casos onde o mentorado precisa forcar o fix manualmente:
```
cp REPO_PATH/scripts/fix-cowork.bat "DESKTOP_PATH/Consertar Cowork.bat"
```

Informe: "Cowork autofix configurado! Roda automaticamente a cada 5 minutos. Voce nunca precisa fazer nada. Se por algum motivo o Cowork travar, tem um atalho 'Consertar Cowork' no Desktop como emergencia."

## 14. Validacao final e resumo

### 14a. Checklist

Execute as seguintes verificacoes e marque cada uma:
- [ ] Node.js instalado (node --version)
- [ ] Caminho do Node.js detectado (NODE_PATH)
- [ ] Pasta Documentos encontrada e acessivel
- [ ] Pasta Desktop encontrada e acessivel
- [ ] _knowledge/ criado com index.md (mapa da estrutura)
- [ ] _gerados/ criado (destino padrao)
- [ ] CLAUDE.md existe na pasta Desktop (instrucoes do Cowork)
- [ ] Templates copiados para _knowledge/templates/ (4 arquivos)
- [ ] MCP server instalado (npm install em mcp-server/)
- [ ] Skills instalados em ~/.claude/skills/ (~30 skills)
- [ ] MCP filesystem configurado no Claude Desktop (com caminhos dinamicos)
- [ ] MCP claude-code configurado no Claude Desktop (com caminhos dinamicos)
- [ ] Trusted folders configurado (Desktop + Documentos)
- [ ] Permissoes do Claude Code configuradas
- [ ] Watcher instalado e rodando (index.md sendo atualizado)
- [ ] Watcher configurado para auto-start com o sistema
- [ ] (Windows) Cowork autofix instalado (tarefa agendada + atalho no Desktop)

### 14b. Mostrar resumo

Apresente um resumo claro do que foi feito:

```
=============================================
  SETUP CONCLUIDO COM SUCESSO!
=============================================

Sistema operacional: [SO]
Pasta Documentos: [caminho]
Pasta Desktop: [caminho]
Node.js: [versao]

O que foi configurado:
  - Knowledge base (_knowledge/index.md com mapa dos seus arquivos)
  - Watcher automatico (mantem o indice atualizado em tempo real)
  - CLAUDE.md no Desktop (instrucoes do Cowork)
  - Templates padrao (contrato, reuniao, decisao, perfil)
  - ~30 skills prontos (documentos, design, landing pages,
    ads, roteiros, email marketing, SEO, social media, e mais)
  - MCP filesystem (Claude Desktop le/escreve seus arquivos)
  - MCP claude-code (Cowork pode acionar o Claude Code)
  - Trusted folders (Desktop + Documentos)
  - Permissoes do Claude Code (executa sem interrupcoes)
  - (Windows) Cowork autofix (previne erro de timeout)

=============================================
  COMO TRABALHAR NO DIA A DIA
=============================================

REGRA DE OURO: Sempre abra o Cowork com a pasta Desktop.
O Cowork le as instrucoes do CLAUDE.md dessa pasta e sabe
exatamente o que fazer com cada pedido.

Voce NAO precisa abrir o terminal. Tudo e pelo Cowork.

COMO USAR O COWORK:
  1. Abra o Claude Desktop
  2. Va na aba Cowork
  3. Selecione a pasta Desktop (so precisa fazer 1 vez)
  4. Peca o que precisar — o Cowork decide sozinho
     se usa filesystem ou claude-code

EXEMPLOS DO QUE VOCE PODE PEDIR:
  - "cria uma apresentacao sobre [tema]"
  - "faz uma landing page pro meu produto"
  - "cria uma proposta comercial em PDF"
  - "gera 5 variacoes de copy pra um anuncio"
  - "cria um roteiro de video de 60 segundos"
  - "monta um calendario de conteudo pro mes"
  - "analisa meus concorrentes"
  - "cria uma sequencia de emails de lancamento"

PROCESSAMENTO AUTOMATICO:
  O Watcher roda em background e detecta automaticamente
  quando voce baixa ou cria um arquivo novo. Ele le o
  conteudo, cria um resumo em _knowledge/topics/, e
  organiza o arquivo na pasta correta quando possivel.
  Voce nao precisa fazer nada — e 100% automatico.

ONDE FICAM SEUS ARQUIVOS:
  Seus arquivos continuam onde sempre estiveram.
  O Claude conhece sua estrutura pelo indice em
  _knowledge/index.md e sabe onde colocar cada coisa.
  Arquivos sem contexto vao para _gerados/.

INSTRUCOES DO COWORK:
  As instrucoes ficam no arquivo CLAUDE.md da pasta Desktop.
  Voce pode ver e editar pela sidebar do Cowork
  (clique em "Instrucoes" no painel lateral direito).

Skills instalados (~30, o Claude usa automaticamente):

  Documentos: docx, pdf, pptx, xlsx
  Design: canvas-design, frontend-design, brand-guidelines
  Web: web-artifacts-builder, landing-page, frontend-slides
  Marketing: ad-copy, social-media-post, seo-content, content-calendar
  Video: video-script
  Comunicacao: internal-comms, email-sequence, doc-coauthoring
  Negocios: commercial-proposal, report-generator, competitor-analysis
  Ads: claude-ads + 12 sub-skills (Meta, Google, YouTube, etc.)
  Meta: skill-creator (cria novos skills sob demanda)
=============================================
```
