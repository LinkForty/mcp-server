/**
 * Analytics tools — clicks, geo, devices, attribution, funnel.
 */
import { z } from 'zod';
import { defineTool } from './shared.js';

const daysSchema = z.number().int().min(1).max(365).optional();

export const getLinkAnalyticsTool = defineTool({
  name: 'get_link_analytics',
  description:
    'Get detailed analytics for a single deep link. Returns total clicks, unique clicks, time series, and breakdowns by country, city, region, timezone, device, and platform. Use the days parameter to control the lookback window (default: 30 days).',
  schema: z.object({
    linkId: z.string().uuid().describe('Link UUID'),
    days: daysSchema.describe('Lookback window in days (default 30)'),
  }),
  handler: async (args, client) => {
    return client.get(`/analytics/links/${args.linkId}`, { days: args.days });
  },
});

export const getOverviewAnalyticsTool = defineTool({
  name: 'get_overview_analytics',
  description:
    'Get workspace-wide analytics across all links. Returns total clicks, unique clicks, time series, geo breakdown (country/city/region/timezone), device/platform/browser breakdown, hourly distribution, UTM parameter breakdown (source/medium/campaign), referrers, and top performing links. Default lookback is 30 days.',
  schema: z.object({
    days: daysSchema.describe('Lookback window in days (default 30)'),
  }),
  handler: async (args, client) => {
    return client.get('/analytics/overview', { days: args.days });
  },
});

export const getTopLinksTool = defineTool({
  name: 'get_top_links',
  description:
    'Get the top performing links in the workspace ranked by total clicks. Returns each link\'s short code, title, total clicks, and unique clicks. Default lookback is 30 days.',
  schema: z.object({
    days: daysSchema.describe('Lookback window in days (default 30)'),
    limit: z.number().int().min(1).max(50).optional().describe('Max number of links to return (default 10)'),
  }),
  handler: async (args, client) => {
    const overview = await client.get<{ topLinks?: unknown[] }>('/analytics/overview', {
      days: args.days,
    });
    const limit = args.limit ?? 10;
    return (overview.topLinks ?? []).slice(0, limit);
  },
});

export const getInstallAttributionTool = defineTool({
  name: 'get_install_attribution',
  description:
    'Get install attribution data showing how app installs are linked to clicks via device fingerprinting. Pass a linkId to get installs for a specific link, or omit it for workspace-wide stats. Returns total installs, attributed vs organic split, attribution rate, time series, platform breakdown, and recent installs. Note: requires the analytics:installs permission.',
  schema: z.object({
    linkId: z.string().uuid().optional().describe('Optional link UUID. Omit for workspace-wide stats.'),
    days: daysSchema.describe('Lookback window in days (default 30)'),
  }),
  handler: async (args, client) => {
    if (args.linkId) {
      return client.get(`/analytics/installs/${args.linkId}`, { days: args.days });
    }
    return client.get('/analytics/installs', { days: args.days });
  },
});

export const getFunnelTool = defineTool({
  name: 'get_funnel',
  description:
    'Get the conversion funnel from clicks → installs → events for the workspace. Returns total clicks, unique clicks, total/attributed installs, click-to-install conversion rate, average/median/p75/p95 time to install, and the top converting links. Useful for understanding overall campaign efficiency. Note: requires the analytics:installs permission.',
  schema: z.object({
    days: daysSchema.describe('Lookback window in days (default 30)'),
    projectId: z.string().uuid().optional().describe('Optional project UUID to filter by'),
  }),
  handler: async (args, client) => {
    return client.get('/analytics/conversion-funnel', {
      days: args.days,
      projectId: args.projectId,
    });
  },
});

export const analyticsTools = [
  getLinkAnalyticsTool,
  getOverviewAnalyticsTool,
  getTopLinksTool,
  getInstallAttributionTool,
  getFunnelTool,
];
