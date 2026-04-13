/**
 * Link management tools.
 */
import { z } from 'zod';
import { defineTool } from './shared.js';

const utmSchema = z
  .object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional(),
  })
  .optional();

const targetingSchema = z
  .object({
    countries: z.array(z.string()).optional(),
    devices: z.array(z.enum(['ios', 'android', 'web'])).optional(),
    languages: z.array(z.string()).optional(),
  })
  .optional();

const linkInputSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  iosUrl: z.string().url().optional(),
  androidUrl: z.string().url().optional(),
  webFallbackUrl: z.string().url().optional(),
  customSchemeUrl: z.string().optional(),
  customCode: z.string().optional(),
  projectId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  templateSlug: z.string().optional(),
  utmParameters: utmSchema,
  targetingRules: targetingSchema,
  deepLinkParameters: z.record(z.any()).optional(),
  attributionWindowHours: z.number().int().min(1).max(2160).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const createLinkTool = defineTool({
  name: 'create_link',
  description:
    'Create a new deep link in LinkForty. Supports device-specific URLs (iOS App Store, Google Play, web fallback), UTM parameters, targeting rules, custom short codes, deep link parameters, attribution window, and expiration. If no templateId or templateSlug is provided, the workspace default template is used automatically. Returns the created link with its short URL.',
  schema: linkInputSchema,
  handler: async (args, client) => {
    // Auto-resolve the default template if none specified
    if (!args.templateId && !args.templateSlug) {
      const templates = await client.get<Array<{ id: string; is_default?: boolean }>>('/templates');
      const defaultTemplate = templates.find((t) => t.is_default);
      if (defaultTemplate) {
        args.templateId = defaultTemplate.id;
      }
    }
    return client.post('/links', args);
  },
});

export const listLinksTool = defineTool({
  name: 'list_links',
  description:
    'List deep links in the current workspace. Supports filtering by status (active/inactive), source (dashboard/sdk/bulk/migration), project, search query (title/description/short code), and date range. Returns a paginated list with click counts.',
  schema: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    source: z.enum(['dashboard', 'sdk', 'bulk', 'migration']).optional(),
    projectId: z.string().uuid().optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
  }),
  handler: async (args, client) => {
    return client.get('/links', args);
  },
});

export const getLinkTool = defineTool({
  name: 'get_link',
  description:
    'Get a single deep link by ID or short code. Use this to inspect a specific link\'s configuration, destinations, UTM parameters, and stats.',
  schema: z.object({
    id: z.string().uuid().optional().describe('Link UUID. Use this OR shortCode.'),
    shortCode: z.string().optional().describe('Link short code (e.g. "abc123"). Use this OR id.'),
  }),
  handler: async (args, client) => {
    if (args.id) return client.get(`/links/${args.id}`);
    if (args.shortCode) return client.get(`/links/discover/${args.shortCode}`);
    throw new Error('Either id or shortCode must be provided');
  },
});

export const updateLinkTool = defineTool({
  name: 'update_link',
  description:
    'Update an existing deep link. All fields are optional — only provided fields are updated. Use this to change destinations, UTM parameters, targeting rules, status (active/inactive), or expiration.',
  schema: z.object({
    id: z.string().uuid().describe('Link UUID to update'),
    title: z.string().optional(),
    description: z.string().optional(),
    iosUrl: z.string().url().optional(),
    androidUrl: z.string().url().optional(),
    webFallbackUrl: z.string().url().optional(),
    customSchemeUrl: z.string().optional(),
    projectId: z.string().uuid().optional(),
    utmParameters: utmSchema,
    targetingRules: targetingSchema,
    deepLinkParameters: z.record(z.any()).optional(),
    attributionWindowHours: z.number().int().min(1).max(2160).optional(),
    expiresAt: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
  handler: async (args, client) => {
    const { id, ...body } = args;
    return client.put(`/links/${id}`, body);
  },
});

export const deleteLinkTool = defineTool({
  name: 'delete_link',
  description:
    'Permanently delete a deep link by ID. This action cannot be undone — historical click events for the link are also removed.',
  schema: z.object({
    id: z.string().uuid().describe('Link UUID to delete'),
  }),
  handler: async (args, client) => {
    return client.delete(`/links/${args.id}`);
  },
});

export const bulkCreateLinksTool = defineTool({
  name: 'bulk_create_links',
  description:
    'Create up to 100 deep links in a single request. Each link in the array uses the same shape as create_link. If no templateId or templateSlug is provided on a link, the workspace default template is used automatically. Returns the count and the array of created links. Useful for importing campaigns or generating links in bulk.',
  schema: z.object({
    links: z.array(linkInputSchema).min(1).max(100),
  }),
  handler: async (args, client) => {
    // Auto-resolve default template for links that don't specify one
    const needsDefault = args.links.some((l) => !l.templateId && !l.templateSlug);
    let defaultTemplateId: string | undefined;
    if (needsDefault) {
      const templates = await client.get<Array<{ id: string; is_default?: boolean }>>('/templates');
      defaultTemplateId = templates.find((t) => t.is_default)?.id;
    }
    if (defaultTemplateId) {
      for (const link of args.links) {
        if (!link.templateId && !link.templateSlug) {
          link.templateId = defaultTemplateId;
        }
      }
    }
    return client.post('/links/bulk-create', args);
  },
});

export const linkTools = [
  createLinkTool,
  listLinksTool,
  getLinkTool,
  updateLinkTool,
  deleteLinkTool,
  bulkCreateLinksTool,
];
