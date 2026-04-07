/**
 * Workspace (organization) tools.
 *
 * Note: an API key is scoped to a single workspace, so list_workspaces always
 * returns just the workspace the key belongs to. The other tools operate on
 * the current workspace implicitly.
 */
import { z } from 'zod';
import { defineTool } from './shared.js';

export const listWorkspacesTool = defineTool({
  name: 'list_workspaces',
  description:
    'List all workspaces accessible by the current API key. Note: API keys are scoped to a single workspace, so this typically returns one workspace. Use this to confirm which workspace the AI is connected to.',
  schema: z.object({}),
  handler: async (_args, client) => {
    return client.get('/workspaces');
  },
});

export const getCurrentWorkspaceTool = defineTool({
  name: 'get_current_workspace',
  description:
    'Get details about the current workspace including subscription tier, member count, link count, project count, and settings. Returns the workspace bound to the active API key.',
  schema: z.object({}),
  handler: async (_args, client) => {
    // List returns just one workspace for an API key — pick the first
    const workspaces = await client.get<Array<{ id: string }>>('/workspaces');
    if (!workspaces?.length) {
      throw new Error('No workspaces accessible by this API key');
    }
    return client.get(`/workspaces/${workspaces[0].id}`);
  },
});

export const getAppConfigTool = defineTool({
  name: 'get_app_config',
  description:
    'Get the iOS/Android app configuration for the current workspace, including app scheme, bundle IDs, package name, Universal Link/App Link domains, app store URLs, and SHA256 fingerprints. Use this to know how to integrate the SDK or build deep link URLs that open the right app.',
  schema: z.object({}),
  handler: async (_args, client) => {
    const workspaces = await client.get<Array<{ id: string }>>('/workspaces');
    if (!workspaces?.length) {
      throw new Error('No workspaces accessible by this API key');
    }
    return client.get(`/workspaces/${workspaces[0].id}/app-config`);
  },
});

export const workspaceTools = [listWorkspacesTool, getCurrentWorkspaceTool, getAppConfigTool];
