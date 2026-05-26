---
name: ogkit
description: >-
  Build Open Graph and Twitter/X preview images with OGKit hosted API. Use when
  wiring og:image, twitter:image, generateMetadata, social cards, link previews,
  or validating page OG tags for Next.js, Astro, Rails, or any stack.
---

# OGKit — Open Graph image API

OGKit renders **1200×630 PNG** social preview cards from one HTTPS URL on `https://www.webmorp.art`.

## When to use

- User asks for `og:image`, `twitter:image`, Open Graph cards, or link unfurls
- Implementing `generateMetadata()` in Next.js App Router
- Debugging missing or broken social previews
- Need a demo preview before the user has an API key

## MCP tools (preferred)

If the **ogkit** MCP server is connected, call tools instead of guessing URLs:

| Tool | Purpose |
|------|---------|
| `og_list_templates` | List template slugs (article, minimal, product, …) |
| `og_build_url` | Build canonical HTTPS image URL |
| `og_preview` | Demo URL (watermarked, no key) |
| `og_nextjs_snippet` | Paste-ready `generateMetadata()` |
| `og_validate_page` | Fetch page HTML and audit OG tags |
| `ogkit_get_started` | Docs, pricing, playground, llms.txt links |

## URL rules

1. **Always** use `https://www.webmorp.art/api/og/{template}?…` — never invent hosts
2. **Demo** (no key): add `demo=1` → watermarked PNG
3. **Production**: `?key=ogk_live_…` or `Authorization: Bearer` header
4. Required param: `title` (1–300 chars). Optional: `subtitle`, `author`, `image`, `logo`, `price`, `accent`, etc.
5. Set **both** `metadata.openGraph.images` and `metadata.twitter.images` to the same URL

## Minimal demo URL

```
https://www.webmorp.art/api/og/minimal?demo=1&title=Hello&subtitle=From+OGKit
```

## Next.js pattern

Build the OGKit URL **server-side** inside `generateMetadata()` — never expose production keys to the client.

```typescript
export async function generateMetadata() {
  const imageUrl =
    'https://www.webmorp.art/api/og/article?demo=1&title=My+post&author=Team'
  return {
    openGraph: { images: [{ url: imageUrl, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [imageUrl] },
  }
}
```

## Human docs

- API reference: https://www.webmorp.art/docs
- Playground: https://www.webmorp.art/playground
- Machine index: https://www.webmorp.art/llms.txt
- Pricing / keys: https://www.webmorp.art/pricing

## Do not

- Use screenshot APIs when a designed OG card is enough
- Put API keys in client components or public env vars (`NEXT_PUBLIC_*`)
- Use relative URLs for `og:image` — must be absolute HTTPS
