#!/usr/bin/env node
/**
 * LinkForty MCP server — Streamable HTTP transport entry point.
 *
 * Runs a stateless HTTP server that speaks the MCP Streamable HTTP protocol.
 * Each request is authenticated via the Authorization header (Bearer token)
 * so multiple users/workspaces can share a single server deployment.
 *
 * Configuration via environment variables:
 *   - PORT                (optional) — HTTP port, defaults to 3001
 *   - LINKFORTY_BASE_URL  (optional) — defaults to https://app.linkforty.com/api
 *
 * Client-side MCP config (Claude Code, Cursor, etc.):
 *
 *   {
 *     "mcpServers": {
 *       "linkforty": {
 *         "type": "http",
 *         "url": "https://mcp.linkforty.com/mcp",
 *         "headers": {
 *           "Authorization": "Bearer dl_..."
 *         }
 *       }
 *     }
 *   }
 */
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { LinkFortyClient } from './client.js';
import { createServer } from './server.js';
import { allTools } from './tools/index.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const BASE_URL = (process.env.LINKFORTY_BASE_URL || 'https://app.linkforty.com/api').replace(/\/$/, '');

/**
 * Extract the Bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Send a JSON error response.
 */
function sendError(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

/**
 * Handle an incoming MCP request.
 *
 * Because this is a stateless multi-tenant server, we create a fresh
 * MCP Server + Transport pair for each request. The API key from the
 * Authorization header determines which workspace the tools operate on.
 */
async function handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const apiKey = extractBearerToken(req);
  if (!apiKey) {
    sendError(res, 401, 'Missing or invalid Authorization header. Expected: Bearer dl_...');
    return;
  }

  const client = new LinkFortyClient({ apiKey, baseUrl: BASE_URL });
  const server = createServer(client);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking
  });

  // Wire up the server to the transport, then handle the request
  await server.connect(transport);
  await transport.handleRequest(req, res);
}

// --- HTTP server ---

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', tools: allTools.length }));
    return;
  }

  // MCP endpoint — POST (messages), GET (SSE stream), DELETE (session termination)
  if (url.pathname === '/mcp') {
    try {
      await handleMcpRequest(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[linkforty-mcp] Request error: ${message}\n`);
      if (!res.headersSent) {
        sendError(res, 500, 'Internal server error');
      }
    }
    return;
  }

  // Everything else → 404
  sendError(res, 404, 'Not found');
});

httpServer.listen(PORT, () => {
  process.stderr.write(
    `[linkforty-mcp] HTTP server listening on port ${PORT}. ${allTools.length} tools available. Base URL: ${BASE_URL}\n`
  );
});
