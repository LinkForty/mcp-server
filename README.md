# @linkforty/mcp-server

[![npm version](https://img.shields.io/npm/v/@linkforty/mcp-server.svg)](https://www.npmjs.com/package/@linkforty/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Connect Claude, Cursor, Claude Code, and any other MCP-compatible AI tool to your LinkForty deep links and analytics.**

This is the official [Model Context Protocol](https://modelcontextprotocol.io) server for [LinkForty](https://linkforty.com). It exposes 20 tools that let an AI assistant manage your deep links, query analytics, configure workspaces, and even generate ready-to-paste SDK integration code for your mobile apps - all using natural language.

## What you can do with it

Once connected, you can ask things like:

- *"Create a LinkForty deep link for my Spring sale on Instagram with UTM source=instagram, medium=social, campaign=spring-sale"*
- *"Which links drove the most installs last week?"*
- *"Show me click trends for my top 5 links over the last 30 days"*
- *"Why is link xyz123 getting clicks but no installs?"*
- *"Help me add the LinkForty SDK to my React Native app"*
- *"Create 50 deep links from this CSV"*

The AI calls the appropriate LinkForty API behind the scenes and returns structured results.

## Quick start

### 1. Get your API key

1. Sign in to your [LinkForty dashboard](https://app.linkforty.com)
2. Go to **Workspace Settings → API Keys**
3. Click **Create API key**, copy the value (starts with `lf_`)

> **Note:** API keys are scoped to a single workspace. If you manage multiple workspaces, you can run multiple instances of the MCP server with different keys.

### 2. Add to your MCP client

#### Claude Desktop

Edit your `claude_desktop_config.json` (location varies by OS - see [Anthropic's docs](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)):

```json
{
  "mcpServers": {
    "linkforty": {
      "command": "npx",
      "args": ["-y", "@linkforty/mcp-server"],
      "env": {
        "LINKFORTY_API_KEY": "lf_your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. The LinkForty tools will appear in the tool picker.

#### Cursor

Add to your Cursor settings under **MCP Servers**:

```json
{
  "linkforty": {
    "command": "npx",
    "args": ["-y", "@linkforty/mcp-server"],
    "env": {
      "LINKFORTY_API_KEY": "lf_your_api_key_here"
    }
  }
}
```

#### Claude Code

```bash
claude mcp add linkforty -e LINKFORTY_API_KEY=lf_your_api_key_here -- npx -y @linkforty/mcp-server
```

### 3. (Optional) Self-hosted LinkForty Core

If you're running LinkForty Core on your own infrastructure, set the base URL:

```json
"env": {
  "LINKFORTY_API_KEY": "lf_your_api_key_here",
  "LINKFORTY_BASE_URL": "https://your-linkforty-instance.com/api"
}
```

## Available tools

### Links (6)

| Tool                | Description                                                                |
|---------------------|----------------------------------------------------------------------------|
| `create_link`       | Create a new deep link with iOS/Android/web URLs, UTM, targeting, and more |
| `list_links`        | List/filter links by status, source, project, search query, or date range  |
| `get_link`          | Get a single link by ID or short code                                      |
| `update_link`       | Update any field on an existing link                                       |
| `delete_link`       | Permanently delete a link                                                  |
| `bulk_create_links` | Create up to 100 links in one call                                         |

### Analytics (5)

| Tool                      | Description                                           |
|---------------------------|-------------------------------------------------------|
| `get_link_analytics`      | Per-link analytics: clicks, geo, devices, time series |
| `get_overview_analytics`  | Workspace-wide analytics across all links             |
| `get_top_links`           | Top performing links ranked by clicks                 |
| `get_install_attribution` | Install attribution data with fingerprint matching    |
| `get_funnel`              | Click → install → event conversion funnel             |

### Templates (3)

| Tool                   | Description                                             |
|------------------------|---------------------------------------------------------|
| `list_templates`       | List all link templates                                 |
| `create_template`      | Create a new template with default destinations and UTM |
| `set_default_template` | Mark a template as the workspace default                |

### Projects (2)

| Tool             | Description                             |
|------------------|-----------------------------------------|
| `list_projects`  | List all projects in the workspace      |
| `create_project` | Create a new project for grouping links |

### Workspace (3)

| Tool                    | Description                                       |
|-------------------------|---------------------------------------------------|
| `list_workspaces`       | List workspaces accessible by the API key         |
| `get_current_workspace` | Get details about the current workspace           |
| `get_app_config`        | Get iOS/Android bundle IDs, schemes, link domains |

### SDK helper (1)

| Tool                      | Description                                                                                        |
|---------------------------|----------------------------------------------------------------------------------------------------|
| `get_sdk_install_snippet` | Generate ready-to-paste SDK init code for any platform (react-native, expo, ios, android, flutter) |

## Configuration

| Environment variable  | Required   | Default                         | Description                                          |
|-----------------------|------------|---------------------------------|------------------------------------------------------|
| `LINKFORTY_API_KEY`   | Yes        | -                               | Your LinkForty workspace API key (starts with `lf_`) |
| `LINKFORTY_BASE_URL`  | No         | `https://app.linkforty.com/api` | Override for self-hosted LinkForty Core instances    |

## Security and privacy

- **Your API key never leaves your machine.** It is only sent in `Authorization: Bearer` headers to the LinkForty API endpoint you configured.
- **No data is stored or logged by the MCP server itself.** It is a stateless translator between MCP requests and LinkForty's REST API.
- **API keys inherit your workspace permissions.** The MCP server can only do what your API key has permission to do - there's no privilege escalation.
- The MCP server runs locally as a subprocess of your AI client and communicates over stdio, not the network.

## Development

```bash
# Install
git clone https://github.com/linkforty/mcp-server
cd mcp-server
npm install

# Build
npm run build

# Watch mode
npm run dev

# Test against your API key
LINKFORTY_API_KEY=lf_... node dist/index.js
```

## License

MIT © LinkForty

## Links

- [LinkForty](https://linkforty.com)
- [LinkForty Docs](https://docs.linkforty.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Report an issue](https://github.com/linkforty/mcp-server/issues)
