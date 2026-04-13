/**
 * Shared MCP Server factory.
 *
 * Creates a configured MCP Server instance with all LinkForty tool handlers
 * registered. Used by both the stdio and HTTP entry points.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { LinkFortyClient } from './client.js';
import { allTools, findTool } from './tools/index.js';
import { asText } from './tools/shared.js';

export function createServer(client: LinkFortyClient): Server {
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

  return server;
}
