import fs from "node:fs";
import os from "node:os";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { query } from "@anthropic-ai/claude-agent-sdk";

const server = new McpServer({
  name: "claude-code-mcp",
  version: "1.0.0"
}, { capabilities: { logging: {} } });

// Default cwd: user's home directory
const defaultCwd = os.homedir();

server.registerTool("task", {
  title: "Run Claude Code",
  description: "Run Claude Code agent to complete a task. Use absolute Windows paths for cwd (e.g. C:\\Users\\...).",
  inputSchema: {
    task: z.string().describe("The task to delegate, keep it close to original user query"),
    cwd: z.string().optional().describe("Working directory (absolute Windows path). Defaults to user home directory."),
    sessionId: z.string().optional().describe("Continue in a previous session")
  }
}, async ({ task, cwd, sessionId }) => {
  const workDir = cwd || defaultCwd;

  if (!fs.existsSync(workDir)) {
    return {
      content: [{ type: "text", text: `Directory ${workDir} does not exist. Use an absolute Windows path like C:\\Users\\...` }],
      isError: true
    };
  }

  let result;
  for await (const message of query({
    prompt: task,
    options: {
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      cwd: workDir,
      resume: sessionId
    }
  })) {
    await server.sendLoggingMessage({
      level: "info",
      data: `${JSON.stringify(message)}`
    });
    if (message.type === "result") result = {
      result: message.result,
      session_id: message.session_id,
      total_cost_usd: message.total_cost_usd
    };
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify(result)
    }],
    _meta: { chatwise: {
      stop: true,
      markdown: result?.result || ""
    } }
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
