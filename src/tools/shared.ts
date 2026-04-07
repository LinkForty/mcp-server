/**
 * Shared helpers for tool definitions.
 */
import { z } from 'zod';
import { zodToJsonSchema } from './zod-to-json-schema.js';
import type { LinkFortyClient } from '../client.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  // Implementation receives the validated args plus the API client
  handler: (args: any, client: LinkFortyClient) => Promise<unknown>;
}

/**
 * Creates a tool definition from a Zod schema. The schema is converted to
 * JSON Schema for the MCP tool listing, and used to validate inputs at call time.
 */
export function defineTool<TSchema extends z.ZodTypeAny>(opts: {
  name: string;
  description: string;
  schema: TSchema;
  handler: (args: z.infer<TSchema>, client: LinkFortyClient) => Promise<unknown>;
}): ToolDefinition {
  return {
    name: opts.name,
    description: opts.description,
    inputSchema: zodToJsonSchema(opts.schema) as Record<string, unknown>,
    handler: async (args: unknown, client: LinkFortyClient) => {
      const parsed = opts.schema.parse(args ?? {});
      return opts.handler(parsed, client);
    },
  };
}

/**
 * Format any value as a JSON string suitable for an MCP text content block.
 */
export function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}
