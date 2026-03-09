# Watcher — Arquitetura e Cenarios

## O que e o Watcher

Processo background (Node.js + chokidar) que monitora Documentos + Downloads do mentorado. Quando detecta mudancas em arquivos de trabalho:

1. Atualiza `_knowledge/index.md` (mapa de pastas — leve, sem LLM)
2. Chama Claude Code via Agent SDK pra ler o CONTEUDO do arquivo
3. Claude decide: relevante ou lixo
4. Se relevante: cria/atualiza knowledge em `_knowledge/topics/` + organiza o arquivo na estrutura existente
5. Se nao sabe onde colocar: marca como `pending` (parking lot) → HILT na proxima sessao

## Anti-loop

O problema central: watcher move arquivo → detecta arquivo na nova pasta → reprocessa → loop infinito.

Solucao: `state.json` com hash MD5 do conteudo de cada arquivo processado.
- Arquivo ja tem hash no state → SKIP (mesmo que tenha mudado de pasta)
- Hash novo → processa
- Movimentacao = mesmo hash, path diferente → nao reprocessa

## Estrutura de _knowledge/

```
_knowledge/
├── index.md       ← mapa de pastas + recentes + pendentes (auto-gerado)
├── state.json     ← estado de processamento (hashes, flags)
├── topics/        ← knowledge por contexto (gerado pelo Claude Code)
│   ├── cliente-x-contrato.md
│   ├── projeto-y-ata-reuniao.md
│   └── ...
└── templates/     ← templates de documentos (copiados no setup)
```

## Extensoes monitoradas (WORK_EXTENSIONS)

Documentos: doc, docx, pdf, txt, md, rtf, odt
Planilhas: xls, xlsx, csv, ods
Apresentacoes: ppt, pptx, odp
Imagens: jpg, jpeg, png, gif, svg, webp, bmp
Web: html, htm
Dados: json, xml, yaml, yml

Tudo que NAO esta nesta lista e ignorado (executaveis, videos, binarios, etc).

## Flags no state.json

```json
{
  "processed": {
    "hash_md5": {
      "status": "resolved | pending",
      "path": "caminho/relativo",
      "processedAt": "ISO date",
      "movedTo": "novo/caminho ou null"
    }
  },
  "pending": [
    { "hash": "...", "path": "...", "addedAt": "..." }
  ]
}
```

- `resolved`: processado e organizado. Nao reprocessar.
- `pending`: Claude nao soube onde colocar. Aguarda HILT.
  - Na proxima sessao do Cowork, index.md mostra a secao "Arquivos pendentes"
  - Cowork pergunta ao usuario o que fazer
  - Usuario decide → marca como resolved (mesmo que a decisao seja "deixa ai")
  - Se usuario nao toma acao → continua aparecendo (nao fica reprocessando)

---

## Cenarios mapeados

### 1. Arquivo novo em Documentos
- **Trigger**: chokidar `add`
- **Acao**: verifica hash no state → se novo, chama Claude Code → le conteudo → cria topic → organiza se souber
- **Status**: IMPLEMENTADO

### 2. Arquivo novo em Downloads
- **Trigger**: chokidar `add` no watcher de Downloads
- **Acao**: mesma logica do cenario 1, mas Downloads e a "inbox natural"
- **Status**: IMPLEMENTADO

### 3. Arquivo modificado
- **Trigger**: chokidar `change`
- **Acao**: hash muda → reprocessa → atualiza topic existente
- **Status**: IMPLEMENTADO (mas ver cenario 9)

### 4. Arquivo deletado
- **Trigger**: chokidar `unlink`
- **Acao**: Claude Code atualiza topic correspondente
- **Status**: IMPLEMENTADO

### 5. Loop por movimentacao
- **Trigger**: watcher move arquivo → detecta na nova pasta
- **Acao**: hash identico no state → SKIP
- **Status**: IMPLEMENTADO

### 6. HILT (Human-in-the-Loop)
- **Trigger**: Claude nao sabe onde colocar
- **Acao**: marca pending → aparece no index.md → Cowork pergunta na proxima sessao
- **Status**: IMPLEMENTADO

### 7. Processamento simultaneo
- **Trigger**: multiplas mudancas rapidas
- **Acao**: debounce 10s + lock `processing` → batch unico
- **Status**: IMPLEMENTADO

---

### 8. Arquivo renomeado
- **Trigger**: mentorado renomeia `doc1.docx` → `proposta_final.docx`
- **Problema**: chokidar vê como `unlink` + `add`. Hash identico → nao reprocessa (OK). Mas o topic ainda referencia o path antigo.
- **Solucao**: quando detecta `add` com hash ja conhecido, atualizar o campo `path` no state.json e pedir ao Claude Code pra atualizar a referencia no topic correspondente.
- **Implementacao**:
  1. No `trackChange`, se evento e `add` e hash existe no state → e um rename
  2. Atualizar `state.processed[hash].path` pro novo caminho
  3. Chamar Claude Code com prompt especifico: "arquivo renomeado de X para Y, atualize o topic"
- **Status**: A IMPLEMENTAR

### 9. Arquivo editado externamente (Word, Excel, etc)
- **Trigger**: mentorado abre DOCX no Word, edita, salva. Hash muda.
- **Problema**: watcher ve hash novo → trata como arquivo novo → cria topic duplicado
- **Solucao**: detectar que e o MESMO PATH com hash diferente = edicao, nao arquivo novo
- **Implementacao**:
  1. No state.json, indexar tambem por path (alem de hash)
  2. Quando `change` em path conhecido → e uma edicao
  3. Prompt pro Claude Code: "arquivo editado, atualize o topic existente" (nao crie novo)
  4. Atualizar o hash no state pro novo valor
- **Status**: A IMPLEMENTAR

### 10. Downloads parciais
- **Trigger**: Chrome cria `.crdownload`, Firefox `.part`, Edge `.partial`
- **Problema**: watcher pode processar arquivo incompleto
- **Solucao**: ignorar extensoes de download parcial
- **Implementacao**:
  Adicionar ao IGNORE_PATTERNS ou criar TEMP_EXTENSIONS blacklist:
  ```
  .crdownload, .part, .partial, .tmp, .temp, .download
  ```
  Tambem: `awaitWriteFinish` com `stabilityThreshold: 3000` no watcher de Downloads (ja implementado com 3s)
- **Status**: A IMPLEMENTAR (facil)

### 11. Multiplos arquivos do mesmo contexto
- **Trigger**: mentorado baixa 5 PDFs do mesmo cliente de uma vez
- **Problema**: watcher cria 5 topics separados em vez de agrupar
- **Solucao**: o debounce de 10s ja agrupa mudancas em batch. O prompt pro Claude Code deve instruir a agrupar por contexto.
- **Implementacao**:
  Ajustar o prompt: "Se multiplos arquivos sao do mesmo cliente/projeto/contexto, agrupe em um unico topic ou atualize o topic existente."
- **Status**: A IMPLEMENTAR (ajuste de prompt)

### 12. Conflitos de sync (OneDrive/iCloud/Dropbox)
- **Trigger**: sync cria duplicatas como `documento (1).docx`, `documento-conflito-Maria.docx`, `documento (Copia de conflito).docx`
- **Problema**: watcher trata como arquivo novo
- **Solucao**: detectar padroes de conflito e ignorar
- **Implementacao**:
  Regex pra detectar:
  ```
  / \(\d+\)\./           → "arquivo (1).docx"
  /-conflito/i           → "arquivo-conflito.docx"
  / - Copy/i             → "arquivo - Copy.docx"
  /Copia de conflito/i   → padrao OneDrive PT-BR
  ```
  Quando detectado: logar "conflito de sync ignorado" e nao processar
- **Status**: A IMPLEMENTAR

### 13. Arquivo grande (>10MB)
- **Trigger**: video MP4, planilha gigante, banco de dados, backup ZIP
- **Problema**: Claude Code nao consegue ler. Timeout ou erro.
- **Solucao**: limite de tamanho. Acima do limite, so indexar metadata (nome, tamanho, data, tipo) sem ler conteudo.
- **Implementacao**:
  1. Antes de enviar pro Claude Code, checar `fs.statSync(file).size`
  2. Se > 10MB: criar topic simplificado automaticamente (sem LLM):
     ```
     # [nome do arquivo]
     Tipo: [extensao]
     Tamanho: [X MB]
     Local: [path]
     Data: [mtime]
     Nota: Arquivo grande, conteudo nao processado automaticamente.
     ```
  3. Marcar como resolved (nao ficar tentando ler)
- **Status**: A IMPLEMENTAR

### 14. State.json crescendo infinitamente
- **Trigger**: anos de uso, milhares de arquivos processados
- **Problema**: state.json fica enorme, lento pra carregar
- **Solucao**: cleanup periodico
- **Implementacao**:
  1. Na inicializacao do watcher, rodar cleanup
  2. Remover entries `resolved` com `processedAt` > 90 dias
  3. Manter `pending` independente da idade (usuario ainda nao decidiu)
  4. Logar quantas entries foram limpas
- **Status**: A IMPLEMENTAR

### 15. Catch-up na inicializacao
- **Trigger**: computador desligado, watcher crashou, mudancas feitas offline
- **Problema**: watcher perdeu eventos. Arquivos novos nao foram processados.
- **Solucao**: na inicializacao, comparar filesystem com state
- **Implementacao**:
  1. Ao iniciar, escanear todos os work files no docsPath
  2. Calcular hash de cada um
  3. Comparar com state.json
  4. Arquivos com hash desconhecido → adicionar a fila de processamento
  5. Limitar catch-up a arquivos com mtime < 7 dias (nao reprocessar tudo)
  6. Processar em batches de 5 pra nao sobrecarregar
- **Cuidado**: primeira execucao pos-setup vai ter MUITOS arquivos desconhecidos. Precisa de modo "initial scan" que indexa sem processar tudo (so processa os 20 mais recentes, por exemplo).
- **Status**: A IMPLEMENTAR

### 16. Pasta compartilhada / arquivos de terceiros
- **Trigger**: OneDrive compartilhado, colega adiciona arquivos
- **Problema**: watcher processa arquivos que nao sao do mentorado
- **Solucao**: por ora, nao tratar como caso especial. O Claude Code vai ler e indexar normalmente — se e relevante pro workspace do mentorado, deve ser indexado.
- **Decisao**: NAO IMPLEMENTAR como caso especial. Se for problema no futuro, adicionar `.watcherignore` (similar a .gitignore)
- **Status**: DECISAO TOMADA (nao implementar)

### 17. Privacidade / Confidencialidade
- **Trigger**: mentorado coloca contrato sigiloso na pasta monitorada
- **Problema**: conteudo e enviado pra API da Anthropic
- **Solucao**: disclaimer no setup + opcao de opt-out por pasta
- **Implementacao**:
  1. No resumo do setup, informar claramente: "Arquivos de trabalho sao lidos pelo Claude para manter o knowledge atualizado. Conteudo e enviado via API."
  2. Arquivo `.nowatcher` na raiz de uma pasta = watcher ignora toda a pasta
  3. Documentar no CLAUDE.md do Desktop
- **Status**: A IMPLEMENTAR (disclaimer no setup + .nowatcher)

### 18. Arquivos temporarios do Office
- **Trigger**: Word cria `~$documento.docx`, Excel cria `~$planilha.xlsx` enquanto aberto
- **Problema**: watcher tenta processar arquivo temporario (que esta locked e vai sumir)
- **Solucao**: ignorar prefixos/extensoes temporarias
- **Implementacao**:
  Adicionar ao IGNORE_PATTERNS:
  ```
  /^~\$/                → temp files do Office (~$documento.docx)
  /\.tmp$/i             → arquivos .tmp genericos
  /\.bak$/i             → backups
  /\.swp$/i             → vim swap files
  /\.lock$/i            → lock files
  ```
- **Status**: A IMPLEMENTAR (facil)

---

## Status de implementacao (v3.0 — 2026-03-07)

Todos os cenarios implementados em index.mjs:

- [x] 1-7: cenarios basicos
- [x] 8: renomeacao (detecta hash conhecido em add, atualiza path no state + topic)
- [x] 9: edicao externa (pathIndex no state, classifica como "edited", delta threshold 100 bytes)
- [x] 10: downloads parciais (ignore .crdownload, .part, .partial, .download, .temp)
- [x] 11: agrupamento por contexto (instrucao no prompt: "agrupe em unico topic")
- [x] 12: conflitos de sync (regex: (1), -conflito, Copy, conflicted copy)
- [x] 13: arquivos grandes >10MB (topic com metadata, sem LLM)
- [x] 14: cleanup state.json (entries resolved > 90 dias removidas na inicializacao)
- [x] 15: catch-up na inicializacao (scan filesystem vs state, max 20 arquivos, ultimos 7 dias)
- [x] 16: .nowatcher opt-out (arquivo .nowatcher na pasta = watcher ignora)
- [x] 17: disclaimer de privacidade (a incluir no setup)
- [x] 18: temp files do Office (~$ ignorado no IGNORE_PATTERNS)
- [x] Temporal decay: topics de entries > 90 dias movidos pra archive/

### Implementado v3.1 (2026-03-07)
- [x] Busca full-text sobre topics (pure JS, zero deps extras). CLI: `node index.mjs --search "query"`. Multi-keyword, ranking por relevancia
- [x] Pre-compaction alternativa: persistencia proativa via CLAUDE.md — Cowork persiste decisoes/fatos DURANTE a conversa, nao espera o final
- [x] Disclaimer de privacidade no CLAUDE.md template

---

## Dependencias

- Node.js (ja requisito do setup)
- chokidar (npm) — file watching cross-platform
- @anthropic-ai/claude-agent-sdk (npm) — chama Claude Code
- Claude Code CLI instalado (ja requisito do setup)

Zero dependencias nativas. `npm install` funciona sem build tools (Python, C++ compiler, etc).

## Auto-start

- Windows: VBS script na pasta Startup (sem janela visivel)
- macOS: LaunchAgent em ~/Library/LaunchAgents/

## Disclaimer (incluir no setup)

"O Claude Workstation Watcher monitora sua pasta Documentos e Downloads para manter o knowledge do Claude sempre atualizado. Quando voce cria ou modifica um arquivo de trabalho (documentos, planilhas, apresentacoes, etc.), o conteudo e lido pelo Claude via API para extrair informacoes relevantes. Se voce tem arquivos confidenciais que NAO devem ser processados, crie um arquivo vazio chamado `.nowatcher` dentro da pasta que deseja proteger."

---

## Referencia: Como o OpenClaw faz (pesquisa 2026-03-07)

Fonte: docs.openclaw.ai — pages: memory, agent-workspace, session-management-compaction, research/memory

### Arquitetura de memoria do OpenClaw

O OpenClaw usa **Markdown como source of truth** — "the files are the source of truth; the model only 'remembers' what gets written to disk."

#### Duas camadas de memoria

1. **Daily logs** (`memory/YYYY-MM-DD.md`): append-only, carregado na sessao (hoje + ontem)
2. **Long-term memory** (`MEMORY.md`): fatos curados e duraveis, carregado apenas em sessoes privadas

#### Estrutura de workspace

```
~/.openclaw/workspace/
├── AGENTS.md        ← instrucoes operacionais (carregado toda sessao)
├── SOUL.md          ← persona, tom, limites
├── USER.md          ← identidade do usuario
├── MEMORY.md        ← memoria longo prazo curada
├── memory/
│   └── YYYY-MM-DD.md   ← logs diarios append-only
└── bank/               ← paginas curadas estaveis
    ├── world.md
    ├── experience.md
    ├── opinions.md
    └── entities/
        ├── Peter.md
        └── The-Castle.md
```

#### Operacoes de memoria: Retain / Recall / Reflect

- **Retain**: secao `## Retain` nos daily logs com fatos auto-contidos, tipados:
  - `W` (world knowledge), `B` (biografico), `O` (opiniao com score de confianca), `S` (sumarios)
  - Exemplo: `"O(c=0.95) @Peter: Prefers concise replies <1500 chars"`

- **Recall**: busca contra SQLite FTS5 — lexical, por entidade, temporal, por opiniao
  - Resultados incluem: kind, timestamp, entities, content, source citation

- **Reflect**: jobs agendados que atualizam paginas de entidades, evoluem confianca de opinioes, propoem updates ao core memory

#### Indexacao e busca

- **SQLite FTS5** como base (rapido, leve, offline) — recomendacao deles: "don't start with SuCo, FTS5 delivers most UX value immediately"
- **Vector embeddings** opcional: SQLite-based, auto-selecao (local GGUF → OpenAI → Gemini → Voyage → Mistral)
- **Hybrid search**: BM25 (keywords exatos) + vector (semantico) com pesos configuraveis
- **MMR re-ranking**: balanceia relevancia com diversidade pra eliminar duplicatas
- **Temporal decay**: score × e^(-λ × ageInDays), half-life 30 dias. MEMORY.md e arquivos nao-datados NUNCA decaem.
- **Chunking**: ~400 tokens com 80 tokens de overlap

#### Anti-duplicacao e freshness

- File watchers com **debounce de 1.5s** marcam indices como dirty → sync assincrono em background
- **Delta thresholds** pra transcripts: so sincroniza quando mudancas > 100KB ou > 50 linhas
- Cache de embeddings (SQLite, max 50k entries) evita re-embedding de texto inalterado
- Mudanca de provider/modelo de embedding → **full reindex automatico**

#### Pre-compaction memory flush

Quando a sessao se aproxima do limite de contexto:
1. Sistema detecta que `contextTokens > contextWindow - reserveTokens`
2. Executa um **"silent agentic turn"** (NO_REPLY) que persiste memorias duraveis no workspace
3. Flush roda UMA VEZ por ciclo de compaction (tracked via `memoryFlushAt`)
4. So entao a compaction roda, resumindo o historico antigo
5. Resultado: informacao critica sobrevive a compaction

#### Bootstrap e limites

- Workspace seed: arquivos grandes truncados durante session injection (`bootstrapMaxChars: 20,000`, `bootstrapTotalMaxChars: 150,000`)
- Sandbox: paths relativos resolvem contra workspace, absolutos podem sair (a menos que sandboxing ativo)

---

### O que podemos aprender do OpenClaw para o nosso Watcher

| OpenClaw faz | Nos fazemos | Adaptacao |
|---|---|---|
| Daily logs append-only | Topics por contexto | Manter topics por projeto/cliente, nao por dia. Pro nosso publico (consultores) faz mais sentido agrupar por contexto do que por data |
| MEMORY.md curado (long-term) | index.md auto-gerado | Adicionar secao "fatos importantes" no index.md ou criar um MEMORY.md separado que o Claude Code atualiza com insights duraveis |
| Retain com tipos (W/B/O/S) | Topic livre | Considerar adicionar tags de tipo nos topics: `tipo: ata`, `tipo: contrato`, `tipo: proposta` pra facilitar busca |
| SQLite FTS5 + vectors | Busca full-text pure JS (v3.1) | IMPLEMENTADO. Busca keyword multi-termo sobre topics, zero deps. CLI: `--search "query"`. FTS5/vectors seria over-engineering pro volume do mentorado |
| Debounce 1.5s no watcher | Debounce 10s | Nosso debounce maior faz sentido porque chamamos Claude Code (caro). OpenClaw usa FTS local (barato) |
| Pre-compaction flush | Persistencia proativa (v3.1) | IMPLEMENTADO via alternativa: CLAUDE.md instrui Cowork a persistir decisoes/fatos DURANTE a conversa, nao esperar final. Nao depende de hook |
| Delta thresholds (100KB/50 linhas) | Nenhum | Implementar: so reprocessar se mudanca > threshold minimo. Evita processar salva-rapida do Word |
| Temporal decay (30 dias half-life) | Cleanup 90 dias | Adotar decay: topics antigos sem atualizacao perdem relevancia. Nao deletar, mas mover pra "archive" |
| Entity pages (Peter.md, etc) | Nao temos | Pra v2: criar paginas por entidade (cliente, projeto) que agregam info de multiplos topics |
| Confidence scores em opinioes | Nao temos | Irrelevante pro nosso caso. Nosso publico nao precisa de tracking de opinioes |
| Sandbox + workspaceAccess | .nowatcher | Manter simples com .nowatcher. Sandbox e over-engineering pro nosso caso |

### Decisoes de design baseadas no OpenClaw

1. **Markdown como source of truth** — JA FAZEMOS. Correto.
2. **File watchers com debounce** — JA FAZEMOS. Nosso debounce e maior (10s vs 1.5s) porque chamamos LLM.
3. **State tracking** — JA FAZEMOS via state.json. OpenClaw usa sessions.json.
4. **Delta thresholds** — ADICIONAR. Nao processar se mudanca < 100 bytes (salva-rapida, autorecovery do Office).
5. **Temporal decay** — ADICIONAR no cleanup. Topics sem atualizacao > 90 dias vao pro archive.
6. **Busca full-text** — IMPLEMENTADO v3.1. Pure JS, zero deps. Busca keyword sobre topics em disco. CLI `--search`.
7. **Pre-compaction alternativa** — IMPLEMENTADO v3.1. Persistencia proativa via CLAUDE.md: Cowork persiste durante a conversa, nao espera final.
8. **Tipos nos topics** — ADICIONAR. Tags como `tipo: ata | contrato | proposta | relatorio` facilitam busca.
