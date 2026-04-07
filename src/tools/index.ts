/**
 * Aggregates all MCP tool definitions.
 */
import type { ToolDefinition } from './shared.js';
import { linkTools } from './links.js';
import { analyticsTools } from './analytics.js';
import { templateTools } from './templates.js';
import { projectTools } from './projects.js';
import { workspaceTools } from './workspaces.js';
import { sdkTools } from './sdk.js';

export const allTools: ToolDefinition[] = [
  ...linkTools,
  ...analyticsTools,
  ...templateTools,
  ...projectTools,
  ...workspaceTools,
  ...sdkTools,
];

export function findTool(name: string): ToolDefinition | undefined {
  return allTools.find((t) => t.name === name);
}
