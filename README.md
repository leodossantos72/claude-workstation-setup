# Claude Workstation

> Transforme seu computador em um assistente de IA operacional em 15 minutos.

Setup plug & play para profissionais nao-tecnicos. Depois de pronto, tudo funciona pelo Claude Desktop — sem terminal, sem codigo.

---

## O que voce vai ter no final

- **Cowork** como assistente principal — peca qualquer coisa em portugues
- **30 skills** prontos — cria PDFs, apresentacoes, planilhas, landing pages, copies, roteiros, propostas comerciais, e mais
- **Watcher automatico** — monitora Downloads e Documentos, le arquivos novos, cria resumos e organiza tudo sozinho
- **Busca full-text** — pesquise qualquer coisa na sua base de conhecimento
- **Segundo cerebro** — tudo que voce baixa ou cria vira conhecimento pesquisavel
- **MCP filesystem** — Claude Desktop le e escreve nos seus arquivos locais
- **MCP claude-code** — Cowork aciona o Claude Code para tarefas complexas

---

## Como funciona depois de pronto

Voce faz tudo pelo **Cowork** (aba do Claude Desktop). Sem terminal. Sem codigo.

```
"cria uma proposta comercial em PDF pro cliente X"
  → Claude gera o PDF com layout profissional

"faz uma landing page pro meu produto"
  → Claude cria HTML + Tailwind completo

"analise o contrato que acabei de baixar"
  → Claude le, resume, organiza e arquiva

"o que temos sobre o cliente X?"
  → Claude busca na base de conhecimento e responde

"monta um calendario de conteudo pro Instagram"
  → Claude gera planilha Excel com datas, temas, copies, hashtags
```

**Processamento automatico:** o Watcher roda em background. Quando voce baixa ou cria um arquivo, ele detecta, le o conteudo, cria um resumo em `_knowledge/topics/` e organiza o arquivo na pasta correta. Voce nao precisa fazer nada.

---

## Pre-requisitos

Antes de comecar, voce precisa ter:

1. **Conta Claude Pro ou Max** — [claude.ai](https://claude.ai)
   - Pro ($20/mes): suficiente para comecar
   - Max ($100/mes): para uso intensivo

2. **Claude Desktop instalado** — [claude.ai/download](https://claude.ai/download)
   - Instale e faca login

3. **Conexao com internet** — para o setup inicial

Nao precisa saber programar. O setup faz tudo automaticamente.

---

## Setup (unica vez — ~15 min)

O setup usa o terminal. Depois disso, voce nunca mais precisa abrir o terminal.

### Passo 1 — Abrir o Terminal

**Windows:**
- Clique na barra de pesquisa e digite **PowerShell**
- Clique em **Windows PowerShell**

**macOS:**
- Pressione **Cmd + Espaco**, digite **Terminal**, Enter

> O terminal e onde voce digita comandos. Voce so vai copiar e colar.

---

### Passo 2 — Instalar o Git

**Windows:**
```
winget install Git.Git
```

Se "winget nao reconhecido": baixe direto de [git-scm.com/downloads/win](https://git-scm.com/downloads/win) e instale com tudo padrao.

**macOS:**
```
xcode-select --install
```

**IMPORTANTE: Feche o terminal e abra novamente.**

---

### Passo 3 — Instalar o Claude Code

**Windows:**
```
irm https://claude.ai/install.ps1 | iex
```

**macOS:**
```
curl -fsSL https://claude.ai/install.sh | bash
```

**IMPORTANTE: Feche o terminal e abra novamente.**

Verificar: `claude --version` (deve mostrar a versao).

---

### Passo 4 — Baixar este repositorio

```
git clone https://github.com/leodossantos72/claude-workstation-setup.git
cd claude-workstation-setup
```

---

### Passo 5 — Rodar o Setup Automatico

```
claude
```

Quando abrir, digite:

```
/setup
```

O Claude vai automaticamente:
1. Verificar pre-requisitos (git, node)
2. Instalar Node.js se necessario
3. Escanear sua pasta Documentos e criar o indice
4. Copiar templates (contrato, reuniao, decisao, perfil)
5. Instalar o MCP server
6. Instalar ~30 skills (documentos, design, marketing, ads, SEO, e mais)
7. Conectar Claude Desktop aos seus arquivos (MCP filesystem)
8. Conectar Cowork ao Claude Code (MCP claude-code)
9. Configurar Cowork como pasta confiavel (Desktop + Documentos)
10. Configurar permissoes do Claude Code
11. Criar instrucoes do Cowork (CLAUDE.md no Desktop)
12. Instalar e configurar o Watcher (monitoramento automatico + busca)
13. Configurar auto-start do Watcher com o sistema
14. (Windows) Instalar Cowork autofix (previne erro de timeout)

**Aceite quando ele pedir permissao.**

---

### Passo 6 — Reiniciar o Claude Desktop

Feche completamente e abra de novo.

Teste no Claude Desktop (aba Cowork, pasta Desktop):

```
liste os arquivos da minha pasta Documentos
```

Se listar, esta tudo pronto!

---

## Uso no dia a dia

**Voce nunca mais precisa abrir o terminal.** Tudo e feito pelo Cowork.

### Como abrir

1. Abra o Claude Desktop
2. Va na aba **Cowork**
3. Selecione a pasta **Desktop** (so precisa fazer 1 vez)
4. Peca o que precisar — o Cowork decide sozinho qual ferramenta usar

### Processar documentos

O Watcher ja processa automaticamente. Mas voce tambem pode pedir:

```
processe o contrato que acabei de baixar em Downloads
```

```
analise esta planilha e me diga os principais insights
```

### Consultar a base de conhecimento

```
o que temos documentado sobre o cliente X?
```

```
quais contratos estao ativos?
```

```
o que ficou pendente nas ultimas reunioes?
```

### Criar documentos e materiais

```
cria uma apresentacao sobre [tema]
```

```
faz uma proposta comercial em PDF pro [cliente]
```

```
gera 5 variacoes de copy pra um anuncio no Instagram
```

```
cria um roteiro de video de 60 segundos pro [produto]
```

```
monta um calendario de conteudo pro mes de abril
```

```
cria uma sequencia de 5 emails de lancamento
```

```
cria uma landing page pro meu [produto/servico]
```

### Analisar arquivos diretamente

- **Arraste um PDF** no Claude Desktop → ele resume
- **Arraste uma planilha Excel** → ele analisa dados
- **Arraste uma imagem** → ele le screenshots, graficos, fotos de documentos

---

## Skills instalados (~30)

O setup instala skills que o Claude usa automaticamente quando voce pede:

| Categoria | Skills | O que fazem |
|-----------|--------|-------------|
| **Documentos** | docx, pdf, pptx, xlsx | Cria Word, PDF, PowerPoint, Excel |
| **Design** | canvas-design, frontend-design, brand-guidelines | Design visual, identidade de marca |
| **Web** | web-artifacts-builder, landing-page, frontend-slides | Landing pages, sites, apresentacoes HTML |
| **Marketing** | ad-copy, social-media-post, seo-content, content-calendar | Copies, posts, SEO, calendario editorial |
| **Video** | video-script | Roteiros para Reels, TikTok, YouTube |
| **Comunicacao** | internal-comms, email-sequence, doc-coauthoring | Comunicados, sequencias de email |
| **Negocios** | commercial-proposal, report-generator, competitor-analysis | Propostas, relatorios, analise competitiva |
| **Ads** | claude-ads + 12 sub-skills | Auditoria de campanhas (Meta, Google, YouTube, LinkedIn, TikTok) |
| **Meta** | skill-creator | Cria novos skills sob demanda |

Voce nao precisa saber os nomes — peca naturalmente e o Claude escolhe o skill certo.

---

## Watcher — monitoramento automatico

O Watcher e um processo que roda em background e:

- **Monitora** Downloads e Documentos em tempo real
- **Detecta** arquivos novos, editados ou renomeados
- **Le o conteudo** via Claude Code (Agent SDK)
- **Cria resumos** em `_knowledge/topics/` com tags e contexto
- **Organiza** arquivos na pasta correta quando possivel
- **Ignora** arquivos temporarios, downloads parciais, conflitos de sync
- **Busca full-text** com SQLite FTS5 — pesquise qualquer palavra no knowledge

### Busca no knowledge

O Cowork pode buscar na base automaticamente. Voce tambem pode buscar direto:

```
node watcher/index.mjs --search "contrato"
```

### Comportamento do Watcher

- Debounce de 10 segundos (espera voce terminar de editar)
- Processa em lotes de 5 arquivos
- Arquivos > 10MB: cria topic com metadata, sem chamar LLM
- Mudancas < 100 bytes: ignora (delta irrelevante)
- Catch-up na inicializacao: processa arquivos perdidos (max 20, ultimos 7 dias)
- Cleanup automatico: topics resolvidos > 90 dias vao para archive/
- Para excluir uma pasta: crie um arquivo `.nowatcher` dentro dela

---

## Estrutura criada no seu computador

O setup respeita 100% a estrutura que voce ja tem. Ele so adiciona:

```
Documentos/
├── [suas pastas existentes]     ← nada muda
├── _knowledge/                  ← memoria da IA
│   ├── index.md                 ← mapa da sua estrutura
│   ├── topics/                  ← resumos de cada arquivo processado
│   ├── templates/               ← modelos padrao (contrato, reuniao, etc)
│   └── search.db                ← indice de busca full-text (SQLite)
└── _gerados/                    ← arquivos criados pelo Claude sem contexto

Desktop/
└── CLAUDE.md                    ← instrucoes do Cowork
```

---

## Quando usar cada ferramenta

| Ferramenta | Quando usar | Exemplo |
|---|---|---|
| **Cowork** | Tudo do dia a dia | "cria uma proposta comercial", "analise este PDF" |
| **Claude Desktop** | Perguntas rapidas, arrastar arquivos | "resuma este documento" |
| **Claude Code** | Nunca — ja e o motor silencioso por tras | Setup e manutencao |

**Regra simples:** abra o Cowork, selecione a pasta Desktop, e peca o que precisar.

---

## Problemas comuns

| Problema | Solucao |
|---|---|
| "winget nao reconhecido" | Baixe o Git direto do site |
| "claude nao reconhecido" | Feche e reabra o terminal |
| Claude Desktop nao ve arquivos | Feche e reabra o Claude Desktop |
| Setup trava | Aceite as permissoes quando perguntado |
| Cowork nao acessa pastas | Verificar trusted folders nas configuracoes |
| Watcher nao inicia | Verifique Node.js: `node --version` |
| Busca nao retorna nada | O watcher precisa processar arquivos primeiro |

### Cowork: "Nao foi possivel iniciar o espaco de trabalho" (Windows)

Este e um problema conhecido do Cowork no Windows. O Cowork usa uma maquina virtual (Hyper-V) que depende de uma rede virtual que o Windows perde com frequencia — apos sleep, hibernacao, updates ou mudancas de rede.

**Sintomas:**
- "Request timed out"
- "VM is already running"
- "Failed to start Claude's workspace"

**Voce provavelmente nunca vai ver esse erro.** O setup instala uma protecao automatica que roda em background a cada 5 minutos e corrige o problema antes de voce perceber. Tambem roda no boot e no logon.

**Se mesmo assim acontecer** (raro — janela de 5 min entre os ciclos):
1. Espere 5 minutos e tente de novo, ou
2. Feche o Claude Desktop, duplo clique em **"Consertar Cowork"** no Desktop, reabra

**Se o setup nao rodou (maquina nova):**
Abra o terminal **como Administrador** (unica vez) e rode:
```
powershell -ExecutionPolicy Bypass -File scripts/setup-cowork-autofix.ps1
```

---

## Privacidade

Arquivos processados pelo Watcher e pelo Cowork sao enviados via API para a Anthropic para analise. **NAO coloque documentos confidenciais, sensiveis ou com dados pessoais de terceiros** na estrutura monitorada.

Para excluir uma pasta do monitoramento automatico, crie um arquivo `.nowatcher` dentro dela:

```
mkdir Documentos/Confidencial
touch Documentos/Confidencial/.nowatcher
```

---

## Proximo nivel

Depois de confortavel com o basico:

- **Gmail**: Claude le seus emails (configurar MCP Gmail)
- **Google Calendar**: Claude ve sua agenda
- **Tarefas agendadas**: Cowork processa automaticamente em horarios definidos
- **Novos skills**: peca "cria um skill que faz X" e o Claude cria pra voce

---

## Arquitetura tecnica

Para detalhes tecnicos do Watcher, veja [watcher/ARCHITECTURE.md](watcher/ARCHITECTURE.md).

### Stack

- **Claude Desktop** — interface do usuario (Cowork)
- **Claude Code** — motor de execucao (Agent SDK)
- **MCP filesystem** — conexao com arquivos locais
- **MCP claude-code** — ponte Cowork → Claude Code
- **Watcher** — Node.js + chokidar + better-sqlite3 (FTS5)
- **Skills** — arquivos .md que ensinam o Claude a executar tarefas

### Plataformas suportadas

- Windows 10/11 (testado)
- macOS Intel e Apple Silicon (suportado)

---

## Suporte

Duvidas? Entre em contato com seu mentor.

Ou pergunte ao proprio Cowork — ele ja conhece seu workspace!
