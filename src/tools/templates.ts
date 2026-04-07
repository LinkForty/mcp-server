/**
 * Link template tools.
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

const templateSettingsSchema = z
  .object({
    defaultIosUrl: z.string().url().optional(),
    defaultAndroidUrl: z.string().url().optional(),
    defaultWebFallbackUrl: z.string().url().optional(),
    defaultAttributionWindowHours: z.number().int().min(1).max(2160).optional(),
    utmParameters: utmSchema,
    targetingRules: targetingSchema,
    expiresAfterDays: z.number().int().min(1).optional(),
  })
  .optional();

export const listTemplatesTool = defineTool({
  name: 'list_templates',
  description:
    'List all link templates in the current workspace. Templates define default destinations, UTM parameters, and targeting rules that new links can inherit. Each template has a slug used for URL routing.',
  schema: z.object({}),
  handler: async (_args, client) => {
    return client.get('/templates');
  },
});

export const createTemplateTool = defineTool({
  name: 'create_template',
  description:
    'Create a new link template. Templates let you define default destinations (iOS/Android/web), UTM parameters, targeting rules, and attribution windows that new links inherit. Useful for ensuring consistency across campaigns.',
  schema: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
    settings: templateSettingsSchema,
  }),
  handler: async (args, client) => {
    return client.post('/templates', args);
  },
});

export const setDefaultTemplateTool = defineTool({
  name: 'set_default_template',
  description:
    'Mark a template as the default for the workspace. The default template is used by the SDK when creating links from mobile apps without specifying a template.',
  schema: z.object({
    id: z.string().uuid().describe('Template UUID to set as default'),
  }),
  handler: async (args, client) => {
    return client.put(`/templates/${args.id}/set-default`, {});
  },
});

export const templateTools = [listTemplatesTool, createTemplateTool, setDefaultTemplateTool];
