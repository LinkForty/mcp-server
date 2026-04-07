/**
 * Project tools — for grouping links.
 */
import { z } from 'zod';
import { defineTool } from './shared.js';

export const listProjectsTool = defineTool({
  name: 'list_projects',
  description:
    'List all projects in the current workspace. Projects are containers for organizing related deep links — for example, by campaign, product, or feature.',
  schema: z.object({}),
  handler: async (_args, client) => {
    return client.get('/projects');
  },
});

export const createProjectTool = defineTool({
  name: 'create_project',
  description:
    'Create a new project to group related links. Returns the created project. Use the project ID when creating links to associate them with this project.',
  schema: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
  }),
  handler: async (args, client) => {
    return client.post('/projects', args);
  },
});

export const projectTools = [listProjectsTool, createProjectTool];
