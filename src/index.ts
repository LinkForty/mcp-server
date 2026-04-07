#!/usr/bin/env node
/**
 * LinkForty MCP server entry point.
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
 *           "LINKFORTY_API_KEY": "lf_..."
 *         }
 *       }
 *     }
 *   }
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import { LinkFortyClient } from './client.js';
import { allTools, findTool } from './tools/index.js';
import { asText } from './tools/shared.js';

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

  const server = new Server(
    {
      name: 'linkforty-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        'LinkForty MCP server. Provides tools for managing deep links, analytics, attribution, ' +
        'templates, projects, and SDK integration. The active workspace is determined by the API key.',
    }
  );

  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  // Dispatch a tool call
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = findTool(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const result = await tool.handler(args ?? {}, client);
      return {
        content: [{ type: 'text', text: asText(result) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // The server now runs until the transport closes
  process.stderr.write(
    `[linkforty-mcp] Connected. ${allTools.length} tools available. Base URL: ${config.baseUrl}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[linkforty-mcp] Fatal error: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
