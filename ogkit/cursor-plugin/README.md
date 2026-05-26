# OGKit Cursor Plugin

One-click Open Graph workflow for Cursor: remote MCP server, agent skill, and metadata rules.

## Install (local test)

1. Copy or symlink this folder to `~/.cursor/plugins/local/ogkit/`
2. Reload Cursor window
3. Confirm **ogkit** appears under MCP servers and connects to `https://www.webmorp.art/api/mcp`

## Install (manual MCP only)

Add to your project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ogkit": {
      "url": "https://www.webmorp.art/api/mcp"
    }
  }
}
```

## What's included

| Component | Path |
|-----------|------|
| MCP config | `mcp.json` → remote Streamable HTTP |
| Agent skill | `skills/ogkit/SKILL.md` |
| Cursor rule | `rules/og-metadata.mdc` |
| Manifest | `.cursor-plugin/plugin.json` |

## MCP tools

- `og_list_templates` — template slugs
- `og_build_url` — canonical image URL
- `og_preview` — watermarked demo URL
- `og_nextjs_snippet` — `generateMetadata()` boilerplate
- `og_validate_page` — audit live page OG tags
- `ogkit_get_started` — docs and onboarding links

## Publish to Cursor Marketplace

1. Ensure this directory lives in the public GitHub repo: `ogkit/cursor-plugin/`
2. Test locally from `~/.cursor/plugins/local/`
3. Submit at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) with repo URL `https://github.com/marfa77/webmorph` and path `ogkit/cursor-plugin`

For a monorepo with multiple plugins, add `.cursor-plugin/marketplace.json` at the repo root listing this plugin's path.

## Also list on

- [cursor.directory](https://cursor.directory) — community MCP registry
- [mcp-marketplace.io](https://mcp-marketplace.io) — MCP server directory

Include endpoint `https://www.webmorp.art/api/mcp` and link to `/docs`.
