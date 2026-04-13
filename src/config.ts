/**
 * Configuration loaded from environment variables.
 */

export interface Config {
  apiKey: string;
  baseUrl: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.LINKFORTY_API_KEY;
  if (!apiKey) {
    throw new Error(
      'LINKFORTY_API_KEY environment variable is required. ' +
      'Get your API key at https://app.linkforty.com/workspace-settings → API Keys.'
    );
  }

  const baseUrl = (process.env.LINKFORTY_BASE_URL || 'https://api.linkforty.com/api')
    .replace(/\/$/, '');

  return { apiKey, baseUrl };
}
