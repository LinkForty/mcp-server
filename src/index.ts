#!/usr/bin/env node
/**
 * LinkForty MCP server — stdio transport entry point.
 *
 * Connects to MCP clients (Claude Desktop, Cursor, Claude Code, etc.) over stdio
 * and exposes the LinkForty Cloud API as a set of tools.
 *
 * Configuration via environment variables:
 *   - LINKFORTY_API_KEY (required) — your LinkForty workspace API key
 *   - LINKFORTY_BASE_URL (optional) — defaults to https://app.linkforty.com/api
 *
 * Add this to your MCP client config:
 *
 *   {
 *     "mcpServers": {
 *       "linkforty": {
 *         "command": "npx",
 *         "args": ["-y", "@linkforty/mcp-server"],
 *         "env": {
 *           "LINKFORTY_API_KEY": "dl_..."
 *         }
 *       }
 *     }
 *   }
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { LinkFortyClient } from './client.js';
import { createServer } from './server.js';
import { allTools } from './tools/index.js';

async function main() {
  // Load config first so we fail fast with a clear error if the API key is missing
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    process.stderr.write(`[linkforty-mcp] ${(err as Error).message}\n`);
    process.exit(1);
  }

  const client = new LinkFortyClient(config);
  const server = createServer(client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // The server now runs until the transport closes
  process.stderr.write(
    `[linkforty-mcp] Connected (stdio). ${allTools.length} tools available. Base URL: ${config.baseUrl}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[linkforty-mcp] Fatal error: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
