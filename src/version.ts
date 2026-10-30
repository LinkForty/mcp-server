import { createRequire } from 'node:module';

/**
 * The package version, read from package.json at runtime so it can never drift
 * from what was published. Resolved relative to this file, which sits in
 * `dist/` after the build and in `src/` under tsx, one level below the root.
 */
const require = createRequire(import.meta.url);
export const VERSION: string = (require('../package.json') as { version: string }).version;

/** How this server introduces itself to the LinkForty API. */
export const USER_AGENT = `linkforty-mcp/${VERSION}`;
