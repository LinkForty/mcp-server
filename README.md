<div align="center">

# LinkForty MCP Server

**Connect Claude, Cursor, Claude Code, and any MCP-compatible AI tool to your LinkForty deep links and analytics.**

[![npm version](https://img.shields.io/npm/v/@linkforty/mcp-server.svg?style=flat-square&color=26adae)](https://www.npmjs.com/package/@linkforty/mcp-server)
[![License: MIT](https://img.shields.io/badge/license-MIT-26adae.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/node/v/@linkforty/mcp-server.svg?style=flat-square&color=26adae)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-1.0-26adae.svg?style=flat-square)](https://modelcontextprotocol.io)

[Quick start](#quick-start) · [Available tools](#available-tools) · [Configuration](#configuration) · [LinkForty](https://linkforty.com)

</div>

---

The official [Model Context Protocol](https://modelcontextprotocol.io) server for [LinkForty](https://linkforty.com). It exposes 20 tools that let an AI assistant manage your deep links, query analytics, configure workspaces, and even generate ready-to-paste SDK integration code for your mobile apps — all using natural language.

The server supports two transport modes:

- **HTTP** (recommended) — connect via URL, no local installation needed
- **stdio** — runs locally as a subprocess of your AI client

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
3. Click **Create API key**, copy the value (starts with `dl_`)

> **Note:** API keys are scoped to a single workspace. If you manage multiple workspaces, you can run multiple instances of the MCP server with different keys.

### 2. Add to your MCP client

#### Option A: HTTP transport (recommended)

No local installation required — just a URL and your API key.

**Claude Desktop** — edit your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linkforty": {
      "type": "http",
      "url": "https://mcp.linkforty.com/mcp",
      "headers": {
        "Authorization": "Bearer dl_your_api_key_here"
      }
    }
  }
}
```

**Cursor** — add to **Cursor → Settings → MCP Servers**:

```json
{
  "linkforty": {
    "type": "http",
    "url": "https://mcp.linkforty.com/mcp",
    "headers": {
      "Authorization": "Bearer dl_your_api_key_here"
    }
  }
}
```

**Claude Code**:

```bash
claude mcp add linkforty --transport http --url https://mcp.linkforty.com/mcp --header "Authorization: Bearer dl_your_api_key_here"
```

#### Option B: stdio transport (local)

Runs the MCP server as a local subprocess. Requires Node.js 18+.

**Claude Desktop** — edit your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linkforty": {
      "command": "npx",
      "args": ["-y", "@linkforty/mcp-server"],
      "env": {
        "LINKFORTY_API_KEY": "dl_your_api_key_here"
      }
    }
  }
}
```

**Cursor** — add to **Cursor → Settings → MCP Servers**:

```json
{
  "linkforty": {
    "command": "npx",
    "args": ["-y", "@linkforty/mcp-server"],
    "env": {
      "LINKFORTY_API_KEY": "dl_your_api_key_here"
    }
  }
}
```

**Claude Code**:

```bash
claude mcp add linkforty -e LINKFORTY_API_KEY=dl_your_api_key_here -- npx -y @linkforty/mcp-server
```

### 3. (Optional) Self-hosted LinkForty Core

If you're running LinkForty Core on your own infrastructure, point the server at your instance.

**HTTP transport** — host the MCP HTTP server yourself and set `LINKFORTY_BASE_URL`:

```bash
LINKFORTY_BASE_URL=https://your-instance.com/api PORT=3001 npx -y @linkforty/mcp-server-http
```

**stdio transport** — set the base URL in the env block:

```json
"env": {
  "LINKFORTY_API_KEY": "dl_your_api_key_here",
  "LINKFORTY_BASE_URL": "https://your-instance.com/api"
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

### stdio transport

| Environment variable  | Required   | Default                         | Description                                          |
|-----------------------|------------|---------------------------------|------------------------------------------------------|
| `LINKFORTY_API_KEY`   | Yes        | —                               | Your LinkForty workspace API key (starts with `dl_`) |
| `LINKFORTY_BASE_URL`  | No         | `https://api.linkforty.com/api` | Override for self-hosted LinkForty Core instances     |

### HTTP transport

| Environment variable  | Required   | Default                         | Description                                          |
|-----------------------|------------|---------------------------------|------------------------------------------------------|
| `PORT`                | No         | `3001`                          | HTTP server port                                     |
| `LINKFORTY_BASE_URL`  | No         | `https://api.linkforty.com/api` | Override for self-hosted LinkForty Core instances     |

The API key is provided per-request via the `Authorization: Bearer` header, not as an environment variable. This allows a single HTTP server deployment to serve multiple users and workspaces.

## Security and privacy

- **No data is stored or logged by the MCP server.** It is a stateless translator between MCP requests and LinkForty's REST API. Every tool call is a fresh HTTP request.
- **API keys inherit your workspace permissions.** The MCP server can only do what your API key has permission to do — there's no privilege escalation.
- **API keys are scoped to a single workspace.** A key for Workspace A cannot access Workspace B's data.

**stdio mode:** The MCP server runs locally as a subprocess. Your API key is stored in your local MCP client config and only sent to the LinkForty API.

**HTTP mode:** Your API key is sent in the `Authorization` header to the hosted MCP endpoint (`mcp.linkforty.com`), which forwards it to the LinkForty API. The MCP server does not store, log, or cache API keys.

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

# Test stdio transport
LINKFORTY_API_KEY=dl_... node dist/index.js

# Test HTTP transport
node dist/http.js                           # starts on port 3001
PORT=8080 node dist/http.js                 # custom port
curl http://localhost:3001/health            # health check
```

## License

MIT © LinkForty

## Links

- [LinkForty](https://linkforty.com)
- [LinkForty Docs](https://docs.linkforty.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Report an issue](https://github.com/linkforty/mcp-server/issues)
