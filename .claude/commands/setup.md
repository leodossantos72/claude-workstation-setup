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
```

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
| Executar codigo (Python, shell) | claude-code |
| Git (commit, push, pull) | claude-code |
| Instalar pacotes, configurar ferramentas | claude-code |
| Criar automacoes ou workflows | claude-code |
| Criar novos skills | claude-code (skill: skill-creator) |

Skills instalados: docx, pdf, pptx, xlsx, canvas-design, frontend-design, web-artifacts-builder, brand-guidelines, internal-comms, doc-coauthoring, skill-creator, frontend-slides.

IMPORTANTE: Nunca pergunte ao usuario qual ferramenta usar. Decida automaticamente. Se a tarefa envolve gerar arquivos (Word, PDF, Excel, PowerPoint, HTML, imagens), SEMPRE use claude-code — ele tem skills especializados pra isso.

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

### 9b. Copiar skills relevantes para ~/.claude/skills/

Crie o diretorio ~/.claude/skills/ se nao existir. Copie APENAS estas pastas do repo clonado (skills/):

- docx
- pdf
- pptx
- xlsx
- canvas-design
- frontend-design
- web-artifacts-builder
- brand-guidelines
- internal-comms
- doc-coauthoring
- skill-creator

Cada pasta contem um SKILL.md. Copie a pasta inteira mantendo a estrutura.

```
mkdir -p ~/.claude/skills
cp -r /tmp/anthropic-skills/skills/docx ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/pdf ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/pptx ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/xlsx ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/canvas-design ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/frontend-design ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/web-artifacts-builder ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/brand-guidelines ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/internal-comms ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/doc-coauthoring ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/anthropic-skills/skills/skill-creator ~/.claude/skills/ 2>/dev/null || true
```

### 9c. Instalar skill de apresentacoes HTML (comunidade)

```
mkdir -p ~/.claude/skills/frontend-slides
```

Crie o arquivo ~/.claude/skills/frontend-slides/SKILL.md com este conteudo:

```
---
name: frontend-slides
description: Cria apresentacoes HTML animadas e responsivas usando HTML, CSS e JavaScript
autoContext: false
---

Ao criar apresentacoes:
1. Use HTML5 + CSS3 + JavaScript puro
2. Crie slides como secoes com transicoes suaves
3. Inclua navegacao por setas do teclado e clique
4. Use design moderno com gradientes, sombras e tipografia limpa
5. Gere um unico arquivo .html auto-contido
6. Adapte para tela cheia (apresentacao) e responsivo (mobile)
```

### 8d. Limpar repo temporario

```
rm -rf /tmp/anthropic-skills
```

Informe quantos skills foram instalados. Exemplo: "11 skills oficiais + 1 da comunidade instalados em ~/.claude/skills/"

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
- [ ] Skills instalados em ~/.claude/skills/ (12 skills)
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
  - 12 skills prontos (Word, PDF, Excel, PowerPoint,
    landing pages, design, apresentacoes HTML, e mais)
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

Skills instalados (o Claude usa automaticamente):
  docx, pdf, pptx, xlsx, canvas-design,
  frontend-design, web-artifacts-builder,
  brand-guidelines, internal-comms,
  doc-coauthoring, skill-creator, frontend-slides
=============================================
```
