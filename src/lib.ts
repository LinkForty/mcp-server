/**
 * Library entry point for @linkforty/mcp-server.
 *
 * This module is imported by non-MCP consumers (e.g. the LinkForty Cloud
 * backend's in-dashboard AI assistant) that want to reuse the tool
 * definitions and client abstraction without running an MCP server.
 *
 * The stdio and HTTP server entry points (`./index.js`, `./http.js`) are
 * unaffected — they remain the "main" ways to run this package.
 *
 * Subpath exports:
 *   import { allTools, type LinkFortyClient } from '@linkforty/mcp-server/lib';
 */

// Tool definitions + registry
export { allTools, findTool } from './tools/index.js';
export type { ToolDefinition } from './tools/shared.js';
export { defineTool, asText } from './tools/shared.js';

// Client interface + default HTTP implementation
export type { LinkFortyClient } from './client.js';
export { HttpLinkFortyClient } from './client.js';

// Individual tool arrays — consumers that want to expose a subset can
// import these directly rather than filtering `allTools`.
export { linkTools } from './tools/links.js';
export { analyticsTools } from './tools/analytics.js';
export { templateTools } from './tools/templates.js';
export { projectTools } from './tools/projects.js';
export { workspaceTools } from './tools/workspaces.js';
export { sdkTools } from './tools/sdk.js';
