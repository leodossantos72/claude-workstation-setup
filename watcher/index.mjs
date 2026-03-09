#!/usr/bin/env node

/**
 * Claude Workstation Watcher v3.1
 *
 * Monitors Documentos + Downloads for file changes.
 * All 18 scenarios + FTS5 search. See ARCHITECTURE.md.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { watch } from "chokidar";
import { query } from "@anthropic-ai/claude-agent-sdk";
import Database from "better-sqlite3";

// --- Configuration ---
const DEBOUNCE_MS = 10000;
const MAX_DEPTH = 2;
const RECENT_FILES_COUNT = 15;
const MAX_BATCH_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_CHANGE_BYTES = 100;            // delta threshold (scenario 9)
const STATE_CLEANUP_DAYS = 90;           // cleanup resolved entries older than this
const CATCHUP_MAX_AGE_DAYS = 7;          // only catch-up files modified in last 7 days
const CATCHUP_MAX_FILES = 20;            // max files to process on first run

// --- Ignore Patterns ---
const IGNORE_PATTERNS = [
  /(^|[/\\])\../,                    // dotfiles/dotfolders
  /node_modules/,
  /\.git[/\\]/,
  /__pycache__/,
  /\.DS_Store$/,
  /Thumbs\.db$/,
  /desktop\.ini$/,
  /_knowledge[/\\]/,                 // our own knowledge dir
  // Scenario 18: Office temp files
  /~\$/,                             // ~$document.docx
  /\.tmp$/i,
  /\.bak$/i,
  /\.swp$/i,
  /\.lock$/i,
  // Scenario 10: partial downloads
  /\.crdownload$/i,
  /\.part$/i,
  /\.partial$/i,
  /\.download$/i,
  /\.temp$/i,
  // Scenario 17: .nowatcher opt-out
  // (handled separately in shouldIgnoreFolder)
];

// Scenario 12: sync conflict patterns
const SYNC_CONFLICT_PATTERNS = [
  / \(\d+\)\./,                      // "file (1).docx"
  /-conflito/i,                      // OneDrive PT-BR
  /Copia de conflito/i,              // OneDrive PT-BR variant
  / - Copy/i,                        // OneDrive EN
  / - C[oó]pia/i,                    // OneDrive PT
  /\(conflict\)/i,                   // Dropbox
  / conflicted copy /i,              // Dropbox variant
];

const WORK_EXTENSIONS = new Set([
  ".doc", ".docx", ".pdf", ".txt", ".md", ".rtf", ".odt",
  ".xls", ".xlsx", ".csv", ".ods",
  ".ppt", ".pptx", ".odp",
  ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".bmp",
  ".html", ".htm",
  ".json", ".xml", ".yaml", ".yml",
]);

// --- Path Detection ---
function detectDocsPath() {
  const home = os.homedir();
  for (const p of [
    path.join(home, "OneDrive", "Documentos"),
    path.join(home, "OneDrive", "Documents"),
    path.join(home, "Documents"),
    path.join(home, "Documentos"),
  ]) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function detectDownloadsPath() {
  const home = os.homedir();
  const p = path.join(home, "Downloads");
  return fs.existsSync(p) ? p : null;
}

// Filter out flags and their values from positional args
const positionalArgs = [];
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--search") { i++; continue; } // skip flag + value
  if (process.argv[i].startsWith("--")) continue;
  positionalArgs.push(process.argv[i]);
}
const docsPath = positionalArgs[0] || detectDocsPath();
if (!docsPath || !fs.existsSync(docsPath)) {
  console.error("Pasta Documentos nao encontrada.");
  process.exit(1);
}

const downloadsPath = positionalArgs[1] || detectDownloadsPath();
const knowledgePath = path.join(docsPath, "_knowledge");
const topicsPath = path.join(knowledgePath, "topics");
const archivePath = path.join(knowledgePath, "archive");
const statePath = path.join(knowledgePath, "state.json");
const indexPath = path.join(knowledgePath, "index.md");

for (const dir of [knowledgePath, topicsPath, archivePath]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- SQLite FTS5 Search ---
const dbPath = path.join(knowledgePath, "search.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS topics (
    name TEXT PRIMARY KEY,
    content TEXT,
    updated_at TEXT
  );
  CREATE VIRTUAL TABLE IF NOT EXISTS topics_fts USING fts5(
    name, content, content=topics, content_rowid=rowid
  );
  CREATE TRIGGER IF NOT EXISTS topics_ai AFTER INSERT ON topics BEGIN
    INSERT INTO topics_fts(rowid, name, content) VALUES (new.rowid, new.name, new.content);
  END;
  CREATE TRIGGER IF NOT EXISTS topics_ad AFTER DELETE ON topics BEGIN
    INSERT INTO topics_fts(topics_fts, rowid, name, content) VALUES('delete', old.rowid, old.name, old.content);
  END;
  CREATE TRIGGER IF NOT EXISTS topics_au AFTER UPDATE ON topics BEGIN
    INSERT INTO topics_fts(topics_fts, rowid, name, content) VALUES('delete', old.rowid, old.name, old.content);
    INSERT INTO topics_fts(rowid, name, content) VALUES (new.rowid, new.name, new.content);
  END;
`);

const stmtUpsert = db.prepare(
  `INSERT INTO topics (name, content, updated_at) VALUES (?, ?, ?)
   ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at`
);
const stmtDelete = db.prepare(`DELETE FROM topics WHERE name = ?`);
const stmtSearch = db.prepare(
  `SELECT name, snippet(topics_fts, 1, '>>>', '<<<', '...', 40) AS snippet, rank
   FROM topics_fts WHERE topics_fts MATCH ? ORDER BY rank LIMIT 20`
);
const stmtCount = db.prepare(`SELECT COUNT(*) AS n FROM topics`);

function indexTopicInDB(topicName) {
  try {
    const content = fs.readFileSync(path.join(topicsPath, topicName), "utf-8");
    stmtUpsert.run(topicName, content, new Date().toISOString());
  } catch {}
}

function removeTopicFromDB(topicName) {
  stmtDelete.run(topicName);
}

function searchTopics(q) {
  try { return stmtSearch.all(q); } catch { return []; }
}

function reindexAllTopics() {
  try {
    const topics = fs.readdirSync(topicsPath).filter((f) => f.endsWith(".md"));
    const tx = db.transaction(() => { for (const t of topics) indexTopicInDB(t); });
    tx();
    log(`FTS5: ${topics.length} topics indexados`);
  } catch {}
}

reindexAllTopics();

// --- Scenario 17: .nowatcher opt-out ---
const nowatcherCache = new Map(); // path → boolean, refreshed on dir events

function shouldIgnoreFolder(filePath) {
  // Walk up from the file to docsPath checking for .nowatcher
  let dir = path.dirname(filePath);
  while (dir.length >= docsPath.length) {
    if (nowatcherCache.has(dir)) {
      if (nowatcherCache.get(dir)) return true;
    } else {
      const hasNowatcher = fs.existsSync(path.join(dir, ".nowatcher"));
      nowatcherCache.set(dir, hasNowatcher);
      if (hasNowatcher) return true;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return false;
}

// --- Scenario 12: sync conflict detection ---
function isSyncConflict(filePath) {
  const name = path.basename(filePath);
  return SYNC_CONFLICT_PATTERNS.some((re) => re.test(name));
}

// --- State Management ---

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf-8"));
  } catch {
    return { processed: {}, pending: [], pathIndex: {} };
  }
}

function saveState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
}

function fileHash(filePath) {
  try {
    return crypto.createHash("md5").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

// Returns: "new" | "known" | "renamed" | "edited"
function classifyFile(filePath, event) {
  const hash = fileHash(filePath);
  if (!hash) return "new";

  const state = loadState();
  const relativePath = path.relative(docsPath, filePath).replace(/\\/g, "/");

  // Check by hash — same content exists
  if (state.processed[hash]) {
    const oldPath = state.processed[hash].path;
    if (oldPath !== relativePath) {
      // Scenario 8: same hash, different path = rename
      return "renamed";
    }
    // Same hash, same path = already processed
    return "known";
  }

  // Check by path — same path, different hash (Scenario 9: external edit)
  if (state.pathIndex && state.pathIndex[relativePath]) {
    return "edited";
  }

  return "new";
}

function markProcessed(filePath, status = "resolved", metadata = {}) {
  const hash = fileHash(filePath);
  if (!hash) return;
  const state = loadState();
  const relativePath = path.relative(docsPath, filePath).replace(/\\/g, "/");

  // Update hash index
  state.processed[hash] = {
    status,
    path: relativePath,
    processedAt: new Date().toISOString(),
    ...metadata,
  };

  // Update path index (Scenario 9: track path→hash mapping)
  if (!state.pathIndex) state.pathIndex = {};
  state.pathIndex[relativePath] = hash;

  // Manage pending list
  if (status === "pending") {
    if (!state.pending.some((p) => p.hash === hash)) {
      state.pending.push({ hash, path: relativePath, addedAt: new Date().toISOString() });
    }
  } else {
    state.pending = state.pending.filter((p) => p.hash !== hash);
  }

  saveState(state);
}

function updatePathAfterRename(oldRelativePath, newFilePath) {
  const state = loadState();
  const newRelativePath = path.relative(docsPath, newFilePath).replace(/\\/g, "/");
  const hash = fileHash(newFilePath);
  if (!hash || !state.processed[hash]) return;

  // Update hash entry
  state.processed[hash].path = newRelativePath;

  // Update path index
  if (state.pathIndex) {
    delete state.pathIndex[oldRelativePath];
    state.pathIndex[newRelativePath] = hash;
  }

  // Update pending
  for (const p of state.pending) {
    if (p.path === oldRelativePath) p.path = newRelativePath;
  }

  saveState(state);
  return { oldPath: oldRelativePath, newPath: newRelativePath };
}

function removeFromState(relativePath) {
  const state = loadState();
  // Find hash by path
  if (state.pathIndex && state.pathIndex[relativePath]) {
    const hash = state.pathIndex[relativePath];
    delete state.processed[hash];
    delete state.pathIndex[relativePath];
    state.pending = state.pending.filter((p) => p.path !== relativePath);
    saveState(state);
  }
}

function getPendingFiles() {
  return loadState().pending;
}

// --- Scenario 14: State cleanup ---
function cleanupState() {
  const state = loadState();
  const cutoff = Date.now() - STATE_CLEANUP_DAYS * 24 * 60 * 60 * 1000;
  let cleaned = 0;

  for (const [hash, entry] of Object.entries(state.processed)) {
    if (entry.status === "resolved" && new Date(entry.processedAt).getTime() < cutoff) {
      // Scenario temporal decay: move topic to archive if exists
      const topicFiles = findTopicForPath(entry.path);
      for (const tf of topicFiles) {
        const src = path.join(topicsPath, tf);
        const dst = path.join(archivePath, tf);
        if (fs.existsSync(src)) {
          try { fs.renameSync(src, dst); removeTopicFromDB(tf); } catch {}
        }
      }
      delete state.processed[hash];
      if (state.pathIndex) delete state.pathIndex[entry.path];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    saveState(state);
    log(`Cleanup: ${cleaned} entries removidas (>${STATE_CLEANUP_DAYS} dias)`);
  }
}

function findTopicForPath(relativePath) {
  // Simple heuristic: find topics that reference this path
  try {
    const topics = fs.readdirSync(topicsPath).filter((f) => f.endsWith(".md"));
    const matches = [];
    for (const t of topics) {
      const content = fs.readFileSync(path.join(topicsPath, t), "utf-8");
      if (content.includes(relativePath)) matches.push(t);
    }
    return matches;
  } catch {
    return [];
  }
}

// --- Scenario 13: Large file handling (no LLM) ---
function handleLargeFile(filePath) {
  const relativePath = path.relative(docsPath, filePath).replace(/\\/g, "/");
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
  const name = path.basename(filePath);
  const date = stat.mtime.toISOString().split("T")[0];

  const topicName = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
  const topicPath = path.join(topicsPath, `${topicName}.md`);

  const content = `# ${name}

**Tipo:** ${ext.slice(1).toUpperCase()}
**Tamanho:** ${sizeMB} MB
**Local:** ${relativePath}
**Data:** ${date}

> Arquivo grande — conteudo nao processado automaticamente.
> Para processar, peca ao Cowork: "analise o arquivo ${name}"
`;

  fs.writeFileSync(topicPath, content, "utf-8");
  indexTopicInDB(`${topicName}.md`);
  markProcessed(filePath, "resolved");
  log(`Arquivo grande (${sizeMB}MB): ${relativePath} → topic criado sem LLM`);
}

// --- Index Generation ---

function getFolders(basePath, currentDepth = 0, maxDepth = MAX_DEPTH) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(basePath, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__") continue;
    const fullPath = path.join(basePath, entry.name);
    const relativePath = path.relative(docsPath, fullPath);
    let fileCount = 0;
    try { fileCount = fs.readdirSync(fullPath).length; } catch {}
    results.push({ path: relativePath.replace(/\\/g, "/"), name: entry.name, fileCount, depth: currentDepth });
    if (currentDepth < maxDepth - 1) results.push(...getFolders(fullPath, currentDepth + 1, maxDepth));
  }
  return results;
}

function getRecentFiles(basePath, maxFiles = RECENT_FILES_COUNT) {
  const files = [];
  function walk(dir, depth = 0) {
    if (depth > 3) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name.startsWith("~$")) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) {
        if (!WORK_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
        try {
          const stat = fs.statSync(fullPath);
          files.push({ path: path.relative(basePath, fullPath).replace(/\\/g, "/"), mtime: stat.mtime });
        } catch {}
      } else if (entry.isDirectory()) { walk(fullPath, depth + 1); }
    }
  }
  walk(basePath);
  files.sort((a, b) => b.mtime - a.mtime);
  return files.slice(0, maxFiles);
}

function buildIndex() {
  const folders = getFolders(docsPath);
  const recentFiles = getRecentFiles(docsPath);
  const now = new Date().toISOString().split("T")[0];
  const topLevel = folders.filter((f) => f.depth === 0);
  const pending = getPendingFiles();

  let md = `# Indice do Workspace\n\nUltima atualizacao: ${now}\n\n## Estrutura de pastas\n\n`;
  for (const folder of topLevel) {
    md += `- \`${folder.path}/\` — ${folder.fileCount} itens\n`;
    for (const child of folders.filter((f) => f.depth === 1 && f.path.startsWith(folder.path + "/"))) {
      md += `  - \`${child.path}/\` — ${child.fileCount} itens\n`;
    }
  }

  md += `\n## Arquivos recentes\n\n`;
  for (const file of recentFiles) {
    md += `- \`${file.path}\` (${file.mtime.toISOString().split("T")[0]})\n`;
  }

  try {
    const topics = fs.readdirSync(topicsPath).filter((f) => f.endsWith(".md"));
    if (topics.length > 0) {
      md += `\n## Knowledge processado\n\n`;
      for (const topic of topics) md += `- \`_knowledge/topics/${topic}\`\n`;
    }
  } catch {}

  if (pending.length > 0) {
    md += `\n## Arquivos pendentes (aguardando decisao do usuario)\n\n`;
    for (const p of pending) md += `- \`${p.path}\` (desde ${p.addedAt.split("T")[0]})\n`;
  }

  // FTS5 stats
  try {
    const count = stmtCount.get().n;
    if (count > 0) {
      md += `\n## Busca\n\nFTS5: ${count} topics indexados em \`_knowledge/search.db\`\n`;
      md += `Para buscar: \`node [WATCHER_PATH]/index.mjs --search "palavra-chave"\`\n`;
    }
  } catch {}

  md += `\n---\n*Atualizado automaticamente pelo Watcher*\n`;
  return md;
}

function writeIndex() {
  fs.writeFileSync(indexPath, buildIndex(), "utf-8");
  log("index.md atualizado");
}

// --- Claude Code Processing ---

let processing = false;

async function processWithClaude(changedFiles) {
  if (processing) {
    log("Processamento anterior em andamento, pulando...");
    return;
  }
  processing = true;

  const changes = changedFiles
    .map((f) => `- ${f.event} (${f.classification}): ${f.relativePath}`)
    .join("\n");

  const folders = getFolders(docsPath);
  const folderList = folders.map((f) => `  ${f.path}/`).join("\n");

  // List existing topics for context
  let existingTopics = "";
  try {
    const topics = fs.readdirSync(topicsPath).filter((f) => f.endsWith(".md"));
    if (topics.length > 0) {
      existingTopics = "\nTOPICS EXISTENTES:\n" + topics.map((t) => `  ${t}`).join("\n");
    }
  } catch {}

  const prompt = `Voce e o indexador inteligente do workspace. Arquivos mudaram.

MUDANCAS DETECTADAS:
${changes}

Legenda de classificacao:
- "new": arquivo totalmente novo, nunca processado
- "edited": arquivo existente foi editado (mesmo path, conteudo diferente). ATUALIZE o topic existente, NAO crie novo
- "renamed": arquivo foi renomeado/movido (mesmo conteudo, path diferente). ATUALIZE a referencia no topic
- "delete": arquivo foi deletado. Atualize o topic correspondente

DIRETORIO BASE: ${docsPath}
KNOWLEDGE DIR: ${topicsPath}/

ESTRUTURA ATUAL DE PASTAS:
${folderList}
${existingTopics}

TAREFA — para cada arquivo:

1. Leia o CONTEUDO (Read tool). NUNCA julgue pelo nome.
2. Decida: RELEVANTE (documento de trabalho) ou LIXO (temp, duplicata, sem valor) → ignore lixo
3. Se RELEVANTE:

   A) KNOWLEDGE: Crie/atualize topic em ${topicsPath}/
      - Se classificacao="edited" → ATUALIZE o topic existente correspondente
      - Se classificacao="renamed" → ATUALIZE apenas a referencia de path no topic
      - Se classificacao="new" → Crie topic novo
      - Nome: baseado no conteudo (ex: "dialogo-ata-reuniao-marco.md")
      - Conteudo: resumo (max 20 linhas), tipo (ata|contrato|proposta|relatorio|planilha|apresentacao|imagem|outro), data, pessoas, pontos-chave
      - Se multiplos arquivos sao do mesmo contexto/cliente: AGRUPE em um unico topic

   B) ORGANIZACAO: Se o arquivo esta "solto" (raiz de Documentos, Downloads) e CLARAMENTE pertence a uma pasta existente → mova (Bash: mv). Se ja esta organizado ou tem duvida → NAO mova.

4. Para "delete": atualize o topic correspondente marcando arquivo removido.

REGRAS:
- SEMPRE leia o conteudo, NUNCA julgue pelo nome
- NUNCA mova pra dentro de _knowledge/ ou _gerados/
- Se imagem: descreva visualmente no topic

RESPONDA com JSON ao final:
\`\`\`json
{"results": [{"file": "caminho/relativo", "action": "resolved|pending", "movedTo": "caminho/ou/null", "topic": "nome-do-topic.md"}]}
\`\`\``;

  try {
    log(`Processando ${changedFiles.length} arquivo(s) com Claude Code...`);

    for await (const message of query({
      prompt,
      options: {
        cwd: docsPath,
        allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns: 25,
      },
    })) {
      if (message.type === "result") {
        log("Processamento concluido");
        const resultText = message.result || "";
        try {
          const jsonMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            const results = JSON.parse(jsonMatch[1]);
            for (const r of results.results || []) {
              const fullPath = path.join(docsPath, r.file);
              const actualPath = r.movedTo ? path.join(docsPath, r.movedTo) : fullPath;
              if (fs.existsSync(actualPath)) {
                markProcessed(actualPath, r.action || "resolved", { topic: r.topic });
              } else if (fs.existsSync(fullPath)) {
                markProcessed(fullPath, r.action || "resolved", { topic: r.topic });
              }
            }
          }
        } catch {
          for (const f of changedFiles) {
            if (fs.existsSync(f.fullPath)) markProcessed(f.fullPath, "resolved");
          }
        }
        log(`Resultado: ${resultText.slice(0, 200).replace(/\n/g, " ")}...`);
      }
    }
  } catch (err) {
    log(`Erro: ${err.message}`);
    for (const f of changedFiles) {
      if (fs.existsSync(f.fullPath)) markProcessed(f.fullPath, "pending");
    }
  } finally {
    processing = false;
    reindexAllTopics();
    writeIndex();
  }
}

// --- Scenario 8: Handle renames (update topic reference) ---
async function handleRename(filePath, oldPath) {
  const renameInfo = updatePathAfterRename(oldPath, filePath);
  if (!renameInfo) return;

  log(`Rename detectado: ${renameInfo.oldPath} → ${renameInfo.newPath}`);

  // Find and update topic
  const topicFiles = findTopicForPath(renameInfo.oldPath);
  for (const tf of topicFiles) {
    const topicFullPath = path.join(topicsPath, tf);
    try {
      let content = fs.readFileSync(topicFullPath, "utf-8");
      content = content.replace(new RegExp(escapeRegex(renameInfo.oldPath), "g"), renameInfo.newPath);
      fs.writeFileSync(topicFullPath, content, "utf-8");
      log(`Topic ${tf} atualizado com novo path`);
    } catch {}
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Change Tracking ---

let pendingChanges = [];
let debounceTimer = null;

function trackChange(event, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  // Use Downloads-relative path if file is under Downloads folder
  const isDownload = downloadsPath && filePath.startsWith(downloadsPath.replace(/\\/g, "/")) ||
                     downloadsPath && filePath.replace(/\\/g, "/").startsWith(downloadsPath.replace(/\\/g, "/"));
  const relativePath = isDownload
    ? "Downloads/" + path.relative(downloadsPath, filePath).replace(/\\/g, "/")
    : path.relative(docsPath, filePath).replace(/\\/g, "/");

  // Skip non-work files (except dir events)
  if (!WORK_EXTENSIONS.has(ext) && !event.includes("Dir")) return;

  // Skip internal dirs
  if (relativePath.startsWith("_knowledge/") || relativePath.startsWith("_Gerados/") || relativePath.startsWith("_gerados/")) return;

  // Scenario 17: .nowatcher opt-out
  if (shouldIgnoreFolder(filePath)) {
    return;
  }

  // Scenario 12: sync conflicts
  if (isSyncConflict(filePath)) {
    log(`Conflito de sync ignorado: ${relativePath}`);
    return;
  }

  log(`${event}: ${relativePath}`);

  // Handle deletes
  if (event === "delete") {
    pendingChanges.push({ event, relativePath, fullPath: filePath, classification: "delete" });
    scheduleProcessing();
    return;
  }

  // Skip dir events from Claude processing
  if (event.includes("Dir")) {
    // Invalidate .nowatcher cache for dir events
    nowatcherCache.clear();
    scheduleProcessing(); // just rebuild index
    return;
  }

  // Classify the file
  const classification = classifyFile(filePath, event);

  if (classification === "known") {
    log(`  → ja processado (hash conhecido), ignorando`);
    return;
  }

  if (classification === "renamed") {
    const state = loadState();
    const hash = fileHash(filePath);
    const oldPath = hash && state.processed[hash] ? state.processed[hash].path : null;
    if (oldPath) {
      handleRename(filePath, oldPath);
    }
    return;
  }

  // Scenario 13: large files
  if (fileSize(filePath) > MAX_FILE_SIZE) {
    handleLargeFile(filePath);
    return;
  }

  // Scenario 9: delta threshold — skip tiny changes (autorecovery, etc)
  if (classification === "edited" && event === "change") {
    const state = loadState();
    const oldHash = state.pathIndex?.[relativePath];
    if (oldHash) {
      const oldEntry = state.processed[oldHash];
      // If processed very recently (< 60s), skip tiny edits
      if (oldEntry && (Date.now() - new Date(oldEntry.processedAt).getTime()) < 60000) {
        const currentSize = fileSize(filePath);
        if (currentSize > 0 && Math.abs(currentSize - (oldEntry.size || currentSize)) < MIN_CHANGE_BYTES) {
          log(`  → mudanca muito pequena (<${MIN_CHANGE_BYTES} bytes), ignorando`);
          return;
        }
      }
    }
  }

  pendingChanges.push({ event, relativePath, fullPath: filePath, classification });
  scheduleProcessing();
}

function scheduleProcessing() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    writeIndex();

    // Separate Claude-processable changes from simple index updates
    const claudeChanges = pendingChanges.filter((c) => !c.event.includes("Dir"));
    pendingChanges = [];

    if (claudeChanges.length > 0) {
      const batch = claudeChanges.slice(0, MAX_BATCH_FILES);
      await processWithClaude(batch);
      // If there were more than MAX_BATCH_FILES, they'll be picked up in catch-up
    }

    debounceTimer = null;
  }, DEBOUNCE_MS);
}

// --- Scenario 15: Catch-up on startup ---
async function catchUp() {
  log("Verificando arquivos nao processados (catch-up)...");
  const state = loadState();
  const cutoff = Date.now() - CATCHUP_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const unprocessed = [];

  function scan(dir, depth = 0) {
    if (depth > 3) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name.startsWith("~$") || entry.name === "node_modules") continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "_knowledge" || entry.name === "_gerados" || entry.name === "_Gerados") continue;
        if (shouldIgnoreFolder(fullPath)) continue;
        scan(fullPath, depth + 1);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!WORK_EXTENSIONS.has(ext)) continue;
      if (isSyncConflict(fullPath)) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.mtime.getTime() < cutoff) continue; // too old
        if (stat.size > MAX_FILE_SIZE) continue; // too big (handle separately if needed)

        const hash = fileHash(fullPath);
        if (hash && !state.processed[hash]) {
          unprocessed.push({
            event: "add",
            relativePath: path.relative(docsPath, fullPath).replace(/\\/g, "/"),
            fullPath,
            classification: "new",
            mtime: stat.mtime,
          });
        }
      } catch {}
    }
  }

  scan(docsPath);

  // Also scan Downloads folder for unprocessed files
  if (downloadsPath && fs.existsSync(downloadsPath)) {
    const dlEntries = fs.readdirSync(downloadsPath, { withFileTypes: true });
    for (const entry of dlEntries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!WORK_EXTENSIONS.has(ext)) continue;
      const fullPath = path.join(downloadsPath, entry.name);
      if (isSyncConflict(fullPath)) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.mtime.getTime() < cutoff) continue;
        if (stat.size > MAX_FILE_SIZE) continue;
        const hash = fileHash(fullPath);
        if (hash && !state.processed[hash]) {
          unprocessed.push({
            event: "add",
            relativePath: "Downloads/" + entry.name,
            fullPath,
            classification: "new",
            mtime: stat.mtime,
          });
        }
      } catch {}
    }
  }

  if (unprocessed.length === 0) {
    log("Catch-up: tudo em dia");
    return;
  }

  // Sort by most recent first, limit
  unprocessed.sort((a, b) => b.mtime - a.mtime);
  const batch = unprocessed.slice(0, CATCHUP_MAX_FILES);

  log(`Catch-up: ${unprocessed.length} arquivos nao processados, processando ${batch.length} mais recentes`);

  // Process in batches of MAX_BATCH_FILES
  for (let i = 0; i < batch.length; i += MAX_BATCH_FILES) {
    const chunk = batch.slice(i, i + MAX_BATCH_FILES);
    await processWithClaude(chunk);
  }
}

// --- Downloads Watcher ---
function setupDownloadsWatcher() {
  if (!downloadsPath) {
    log("Pasta Downloads nao encontrada");
    return null;
  }
  log(`Monitorando Downloads: ${downloadsPath}`);

  const dlWatcher = watch(downloadsPath, {
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true,
    depth: 1,
    awaitWriteFinish: { stabilityThreshold: 3000, pollInterval: 1000 },
    usePolling: process.platform === "win32", // polling is more reliable on Windows/OneDrive
    interval: 2000,
  });

  let dlReady = false;
  dlWatcher
    .on("add", (p) => trackChange("add", p))
    .on("ready", () => { dlReady = true; log("Downloads watcher pronto"); })
    .on("error", (err) => {
      log(`Downloads watcher error: ${err}`);
      // Retry after 30s if watcher fails
      setTimeout(() => {
        log("Tentando reiniciar Downloads watcher...");
        dlWatcher.close().then(() => setupDownloadsWatcher()).catch(() => {});
      }, 30000);
    });

  // Health check: if not ready after 10s, warn
  setTimeout(() => {
    if (!dlReady) log("AVISO: Downloads watcher nao ficou pronto em 10s");
  }, 10000);

  return dlWatcher;
}

// --- Logging ---
function log(msg) {
  console.log(`[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`);
}

// --- CLI: search mode (node index.mjs --search "query") ---
const searchIdx = process.argv.indexOf("--search");
if (searchIdx !== -1) {
  const searchQuery = process.argv[searchIdx + 1];
  if (searchQuery) {
    const results = searchTopics(searchQuery);
    if (results.length === 0) {
      console.log("Nenhum resultado encontrado.");
    } else {
      for (const r of results) {
        console.log(`\n--- ${r.name} ---`);
        console.log(r.snippet);
      }
    }
  } else {
    console.log("Uso: node index.mjs --search \"palavra-chave\"");
  }
  process.exit(0);
}

// --- Start ---
console.log(`\nClaude Workstation Watcher v3.2`);
console.log(`Documentos: ${docsPath}`);
console.log(`Downloads: ${downloadsPath || "(nao encontrado)"}`);
console.log(`Knowledge: ${knowledgePath}`);
console.log(`Debounce: ${DEBOUNCE_MS / 1000}s | Max file: ${MAX_FILE_SIZE / 1024 / 1024}MB | Cleanup: ${STATE_CLEANUP_DAYS}d\n`);

// Scenario 14: cleanup old state entries + temporal decay
cleanupState();

// Build initial index
writeIndex();

// Watch Documentos
const docsWatcher = watch(docsPath, {
  ignored: IGNORE_PATTERNS,
  persistent: true,
  ignoreInitial: true,
  depth: 4,
  awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
});

docsWatcher
  .on("add", (p) => trackChange("add", p))
  .on("change", (p) => trackChange("change", p))
  .on("unlink", (p) => trackChange("delete", p))
  .on("addDir", (p) => trackChange("addDir", p))
  .on("unlinkDir", (p) => trackChange("deleteDir", p))
  .on("error", (err) => log(`Docs watcher error: ${err}`))
  .on("ready", async () => {
    log("Docs watcher pronto");

    // Watch Downloads
    const dlWatcher = setupDownloadsWatcher();

    // Scenario 15: catch-up after watchers are ready
    await catchUp();

    log("Aguardando mudancas...\n");

    // Graceful shutdown
    for (const sig of ["SIGINT", "SIGTERM"]) {
      process.on(sig, () => {
        log("Encerrando...");
        db.close();
        const closers = [docsWatcher.close()];
        if (dlWatcher) closers.push(dlWatcher.close());
        Promise.all(closers).then(() => process.exit(0));
      });
    }
  });
