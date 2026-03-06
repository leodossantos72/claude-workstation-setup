# Claude Workstation Setup

> Transforme seu computador em um assistente de IA operacional em 15 minutos.

## O que voce vai ter no final

- Claude Desktop conectado aos seus arquivos locais
- Cowork processando documentos em background
- Estrutura de "segundo cerebro" organizada automaticamente
- Base de conhecimento pesquisavel — pergunte qualquer coisa sobre seus documentos

## Como funciona depois de pronto

Voce faz tudo pelo **Claude Desktop**. Sem terminal. Sem codigo.

```
"processe os arquivos novos de Downloads"
→ Claude le, resume, organiza e arquiva

"o que temos sobre o cliente X?"
→ Claude responde com base nos seus documentos

"analise esta planilha"
→ arraste o Excel e pergunte
```

---

## Pre-requisitos

Antes de comecar:

1. **Conta Claude Pro ou Max** — [claude.ai](https://claude.ai)
   - Pro ($20/mes): suficiente para comecar
   - Max ($100/mes): para uso intensivo

2. **Claude Desktop instalado** — [claude.ai/download](https://claude.ai/download)
   - Instale e faca login

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
1. Instalar Node.js (necessario para conexoes)
2. Criar a estrutura de pastas do segundo cerebro
3. Conectar o Claude Desktop aos seus arquivos (MCP filesystem)
4. Conectar o Cowork ao Claude Code (MCP claude-code)
5. Configurar o Cowork como pasta confiavel
6. Copiar templates e criar indices
7. Configurar permissoes

**Aceite quando ele pedir permissao.**

---

### Passo 6 — Reiniciar o Claude Desktop

Feche completamente e abra de novo.

Teste no Claude Desktop:

```
liste os arquivos da minha pasta Documentos
```

Se listar, esta tudo pronto!

---

## Uso no dia a dia

**Voce nunca mais precisa abrir o terminal.** Tudo e feito pelo Claude Desktop.

### Processar documentos novos

No Claude Desktop, diga:

```
processe os arquivos novos que estao em Downloads
```

Ou seja mais especifico:

```
analise o contrato que acabei de baixar em Downloads e gere um resumo estruturado
```

O Claude:
- Le o arquivo via MCP
- Identifica o tipo (contrato, reuniao, etc)
- Gera um resumo estruturado usando o template correto
- Salva na pasta de conhecimento
- Move o original para a pasta de processados
- Atualiza os indices

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

### Analisar arquivos diretamente

- **Arraste um PDF** no Claude Desktop → ele resume
- **Arraste uma planilha Excel** → ele analisa dados
- **Arraste uma imagem** → ele le screenshots, graficos, fotos de documentos

### Usar o Cowork para tarefas longas

Para processar muitos arquivos ou tarefas que levam tempo, use o Cowork:

```
[Cowork] processe todos os PDFs de Downloads, gere resumos e organize tudo
```

O Cowork trabalha em background — voce pode fazer outras coisas.

---

## Quando usar cada ferramenta

| Ferramenta | Quando usar | Exemplo |
|---|---|---|
| **Claude Desktop** | Perguntas rapidas, arrastar arquivos | "resuma este PDF" |
| **Cowork** | Tarefas longas, processamento em lote | "processe todos os arquivos de Downloads" |
| **Claude Code** | Quase nunca — so para setup ou manutencao avancada | Ja esta configurado como motor silencioso |

**Regra simples:** se voce consegue pedir no Claude Desktop, faca por la.

---

## Estrutura do seu computador

```
Documentos/
├── CLAUDE.md                 ← contexto para a IA
├── Consultorias/
│   ├── _templates/           ← modelos padrao
│   │   ├── contract.md
│   │   ├── meeting.md
│   │   ├── decision.md
│   │   └── client_profile.md
│   ├── _overview/            ← visao consolidada
│   │   ├── clients_index.md
│   │   └── pending_actions.md
│   └── {SeuCliente}/
│       ├── knowledge/        ← resumos e analises
│       └── processed/        ← originais ja processados
├── Ventures/                 ← negocios proprios
├── Metodos/                  ← frameworks
└── _Misc/                    ← diversos
```

---

## Exemplos de uso real

### Recebeu um contrato por email
1. Baixa o PDF (vai pra Downloads)
2. No Claude Desktop: "processe o contrato que acabei de baixar"
3. Claude gera resumo com valores, datas, riscos, proximas acoes
4. Depois: "qual o valor total dos contratos ativos?" → ele responde

### Fez uma reuniao
1. Escreve notas rapidas num .txt e salva em Downloads
2. No Claude Desktop: "processe as notas da reuniao de hoje"
3. Claude gera ata estruturada com decisoes e pendencias

### Quer um panorama geral
No Claude Desktop:
```
me de um resumo executivo de todos os clientes e pendencias
```

### Precisa analisar uma planilha
Arrasta o .xlsx no Claude Desktop:
```
analise esta planilha e me diga os principais insights
```

---

## Problemas comuns

| Problema | Solucao |
|---|---|
| "winget nao reconhecido" | Baixe o Git direto do site |
| "claude nao reconhecido" | Feche e reabra o terminal |
| Claude Desktop nao ve arquivos | Feche e reabra o Claude Desktop |
| Setup trava | Aceite as permissoes quando perguntado |
| Cowork nao acessa pastas | Verificar trusted folders nas configuracoes |

---

## Proximo nivel

Depois de confortavel com o basico:

- **Gmail**: Claude le seus emails (configurar MCP Gmail)
- **Google Calendar**: Claude ve sua agenda
- **Tarefas agendadas**: Cowork processa automaticamente em horarios definidos
- **Relatorios**: gerar planilhas e apresentacoes
- **Multiplos clientes**: criar pastas separadas por cliente com contexto proprio

---

## Suporte

Duvidas? Entre em contato com seu mentor.

Ou pergunte ao proprio Claude Desktop — ele ja conhece seu workspace!
