import Link from 'next/link'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { clipMetaDescription } from '@/lib/seo-meta'

type ComparePage = {
  h1: string
  title: string
  description: string
  intro: string
  statement: string
  rows: [string, string, string][]
  ogkitFit: string[]
  otherFit: string[]
  code: string
  links: [string, string][]
  /** Optional long-form sections (paragraphs and/or bullets) */
  sections?: { heading: string; paragraphs?: string[]; bullets?: string[] }[]
  /** If true, Quick comparison renders before sections (default: sections first) */
  sectionsAfterTable?: boolean
  /** If set, replaces the default three FAQ cards and FAQPage JSON-LD */
  faq?: { question: string; answer: string }[]
  /** Optional closing line before related links */
  closing?: string
  /** Extra schema.org nodes (merged under @graph in a second script tag) */
  structuredDataGraph?: Record<string, unknown>[]
}

const COPY: Record<string, ComparePage> = {
  'ogkit-vs-vercel-og': {
    h1: 'OGKit vs @vercel/og',
    title: 'OGKit vs @vercel/og — Open Graph image API alternative',
    description:
      "@vercel/og ties you to Vercel's infrastructure and JSX templates. OGKit gives you a plain HTTPS URL that works anywhere — no Edge Runtime, no 500KB bundle limit, no platform lock-in.",
    intro:
      '@vercel/og is a solid choice if you are already deep in the Next.js and Vercel ecosystem. OGKit is the alternative when you want Open Graph images from a plain HTTPS URL — no JSX, no Edge Runtime dependency, no bundle size budget to manage.',
    statement:
      'Both produce 1200×630 PNG social preview cards. The difference is where rendering lives and how much infrastructure coupling you accept.',
    rows: [
      ['Rendering approach', 'Hosted API — one HTTPS URL, any backend.', 'Edge Function or Node.js route inside your Next.js app using @vercel/og.'],
      ['Framework requirement', 'None — works with any stack that can emit a URL.', 'Designed around Next.js `ImageResponse` patterns (App Router is the common home).'],
      ['Bundle size limit', 'None — templates run on OGKit’s side.', 'Roughly 500KB budget for the function bundle (JSX, fonts, assets) on typical Edge setups.'],
      ['Platform dependency', 'None — embed the URL from any host, CI job, or script.', 'Tied to wherever you deploy that Next.js route (often Vercel for the full Edge story).'],
      ['Template changes', 'Swap the template slug and query params — no redeploy.', 'Edit JSX components and redeploy your app.'],
      [
        'Pricing model',
        'Free watermarked tier; Pro from $19/mo and Scale from $99/mo (crypto, monthly quota).',
        'No separate @vercel/og line item — usage shows up on Vercel meters (e.g. function invocations, data transfer) depending on your plan.',
      ],
      ['Crypto payment', 'Yes — Cryptomus checkout without a card.', 'No — billed through Vercel / card rails.'],
    ],
    sectionsAfterTable: true,
    sections: [
      {
        heading: 'What @vercel/og does well',
        paragraphs: [
          '@vercel/og uses Satori and Resvg under the hood, which gives you JSX-to-PNG control. If you need pixel-level layout freedom and your stack already runs on Vercel, the integration is tight. Responses can be cached on a CDN in the usual Next.js way, and the library tracks the platform you deploy on.',
        ],
        bullets: [
          'Your project is a Next.js App Router application deployed on Vercel.',
          'You want full JSX control over every pixel of the image layout.',
          'You are comfortable managing font files, image assets, and bundle size within the Edge bundle budget.',
          'You do not need to generate OG images from outside your Next.js deployment boundary.',
        ],
      },
      {
        heading: 'Where @vercel/og creates friction',
        paragraphs: [
          'The core trade-off is coupling. @vercel/og runs as part of your application’s image route — usually Edge or Node depending on how you configure it.',
        ],
        bullets: [
          'Platform coupling. If you move hosting, you rewrite or relocate that route — the template is not a standalone HTTPS product. OGKit stays a stable third-party URL.',
          'Bundle budget. Custom brand fonts and assets compete for the same function size limit; heavy designs hit it fast.',
          'JSX workflow. Every template change is a code change and redeploy. OGKit swaps behavior by changing the path and query string.',
          'Metering. There is no OG-specific SKU — cost appears as platform usage (invocations, egress, etc.) that can be harder to forecast at scale.',
          'Runtime fit. Teams on older Pages Router or mixed runtimes may need extra wiring compared to copy-paste App Router examples.',
        ],
      },
    ],
    ogkitFit: [
      'You want OG images from any backend — Node, Python, Go, Ruby, PHP, or a shell script publishing static HTML.',
      'You are not on Vercel, or you want image generation independent of where the app is hosted.',
      'You prefer predictable monthly quota (free tier, then Pro / Scale) instead of compounding platform meters alone.',
      'Your team wants to swap templates via URL parameters, not JSX edits and redeploys.',
      'You want to pay with crypto instead of card-only SaaS checkout.',
    ],
    otherFit: [
      'Your project is a Next.js App Router app on Vercel and you are happy keeping OG generation inside the repo.',
      'You need full JSX layout control for every route.',
      'You already run @vercel/og with fonts, tests, and caching dialed in.',
      'Sensitive data for the card must never leave your own runtime.',
    ],
    code: `import type { Metadata } from "next";

const url = new URL("${siteConfig.url}/api/og/article");
url.searchParams.set("key", process.env.OGKIT_KEY!);
url.searchParams.set("title", "Getting started");
url.searchParams.set("subtitle", "OGKit API reference");

// Works on Vercel, Railway, Fly, a VPS, or static CI — same URL
export const metadata: Metadata = {
  openGraph: { images: [url.toString()] },
  twitter: { images: [url.toString()] },
};`,
    faq: [
      {
        question: 'Is OGKit a replacement for @vercel/og?',
        answer:
          'OGKit replaces @vercel/og for teams that want a hosted image API instead of owning an `ImageResponse` route. If you need full JSX layout control inside a Next-only project, @vercel/og remains the right primitive. If you want a URL-based API from any stack, OGKit is the replacement.',
      },
      {
        question: 'Does OGKit work inside a Next.js project on Vercel?',
        answer:
          'Yes. OGKit is a plain HTTPS API. Call it from `generateMetadata`, a Route Handler, or a Server Component — on Vercel or anywhere else. There is no Edge Runtime requirement on your side.',
      },
      {
        question: 'What happens to my OG images if I migrate off Vercel?',
        answer:
          'With @vercel/og, you move or re-host the route that renders the image. With OGKit, the public API URL stays the same — only your app’s deployment changes.',
      },
      {
        question: 'How does OGKit pricing compare to @vercel/og?',
        answer:
          '@vercel/og has no separate license; cost shows up as your hosting usage. OGKit offers a free watermarked tier and paid Pro ($19/month) and Scale ($99/month) plans with monthly image quota and crypto checkout — a direct product line item.',
      },
      {
        question: 'Can I use custom fonts with OGKit?',
        answer:
          'Templates use curated typography. On paid plans you can select from Google Fonts via the `font` query parameter where the template supports it (see the API reference). Arbitrary font file uploads are not supported — use the contact form if you have a special requirement.',
      },
      {
        question: 'Does OGKit support frameworks other than Next.js?',
        answer:
          'Yes. Any framework or static site that can put a URL in `og:image` works: Remix, Astro, SvelteKit, Nuxt, Rails, Laravel, Express, FastAPI, etc.',
      },
    ],
    closing:
      'The same OGKit URL works whether your app runs on Vercel, Railway, Fly.io, a bare VPS, or a CI job emitting HTML.',
    structuredDataGraph: [
      {
        '@type': 'WebPage',
        name: 'OGKit vs @vercel/og — Open Graph image API alternative',
        description:
          "@vercel/og ties you to Vercel's infrastructure and JSX templates. OGKit gives you a plain HTTPS URL that works anywhere — no Edge Runtime, no 500KB bundle limit, no platform lock-in.",
        url: absoluteSiteUrl('/compare/ogkit-vs-vercel-og'),
        publisher: {
          '@type': 'Organization',
          name: 'OGKit',
          url: absoluteSiteUrl(''),
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'OGKit',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        url: absoluteSiteUrl(''),
        description:
          'Open Graph image API. Generate 1200×630 social preview cards from a plain HTTPS URL. Works with any framework or hosting platform.',
        offers: {
          '@type': 'Offer',
          price: '19',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '19',
            priceCurrency: 'USD',
            billingDuration: 'P1M',
            name: 'Pro plan (paid monthly quota)',
          },
        },
      },
    ],
    links: [
      ['Dynamic social preview guide', '/use-case/dynamic-social-preview-images'],
      ['Docs preview images', '/use-case/docs'],
      ['API reference', '/docs'],
      ['Pricing', '/pricing'],
    ],
  },
  'ogkit-vs-bannerbear': {
    h1: 'OGKit vs Bannerbear',
    title: `OGKit vs Bannerbear — Open Graph image API alternative`,
    description:
      'OGKit vs Bannerbear: URL-based Open Graph images for Next.js and SaaS vs creative automation, template editor, Zapier, and Bannerbear pricing ($49/mo, signed URLs on Scale at $149/mo).',
    intro:
      'OGKit is a Bannerbear alternative for developers who need Open Graph images from a URL — not a broad creative automation platform with a visual editor, Zapier workflows, and video generation. Bannerbear is a mature marketing automation suite used by thousands of teams. OGKit is a focused API that does one thing: turn a URL with parameters into a production-ready 1200×630 social preview card. If your use case is Open Graph images for a Next.js app, SaaS product, blog, or docs site, OGKit gets you there faster with a smaller surface area.',
    statement:
      'Bannerbear shines when marketing owns templates and many asset types. OGKit shines when engineering owns metadata and wants one cache-friendly PNG URL for `og:image` and Twitter cards — including signed URLs on paid tiers without a Bannerbear Scale price floor.',
    rows: [
      ['Primary use case', 'Open Graph and Twitter card images.', 'Images, video, PDF, marketing automation.'],
      ['Setup time', 'Paste URL into og:image — done.', 'Design templates in a visual editor first.'],
      ['API style', 'URL-based; no SDK required.', 'REST API with async rendering.'],
      ['Signed URLs', 'Included on Pro and Scale.', 'Scale plan and above ($149/mo).'],
      ['No-login preview', 'Yes — watermarked demo without account (`demo=1`).', 'No — requires signup.'],
      ['Payment method', 'Crypto (global, no card processor).', 'Credit card only.'],
      ['Template editor', 'No — curated templates via API.', 'Yes — full drag-and-drop editor.'],
      ['Video generation', 'No.', 'Yes.'],
      ['PDF generation', 'No.', 'Yes.'],
      ['Zapier / Make / n8n', 'No.', 'Yes.'],
      ['Airtable integration', 'No.', 'Yes.'],
      ['Team members', 'No dedicated team seats in-product.', 'Scale plan and above.'],
      ['Free trial', 'Watermarked demo images, no signup.', '30 API credits, no credit card.'],
      ['Entry price', 'Free tier; Pro from $19/mo (crypto).', '$49/month (1,000 image credits).'],
    ],
    ogkitFit: [
      'You need Open Graph images for a Next.js, Astro, Rails, or Django app and want a hosted solution instead of maintaining `@vercel/og` routes yourself.',
      'Your team is global and card-based checkout is a blocker.',
      'You want to try before you buy — watermarked demos without signup.',
      'You need signed URLs without paying $149/month on Bannerbear Scale.',
      'You want a simple, predictable API surface with no visual editor overhead.',
    ],
    otherFit: [
      'You need image and video and PDF generation from one platform.',
      'Your marketing team uses Zapier, Make, or Airtable to trigger asset generation without code.',
      'You need a visual template editor for non-developers.',
      'You generate high volumes of varied marketing assets beyond social preview cards.',
    ],
    sections: [
      {
        heading: 'Pricing comparison',
        paragraphs: [
          'Bannerbear starts at $49/month for 1,000 image credits. Signed URLs — the feature many developer products need for dynamic og:image generation — are on the $149/month Scale plan. Team members and roles are also Scale-only. There is no free tier after the 30-credit trial.',
          `OGKit uses crypto checkout (Cryptomus) for Pro ($19/month, 100,000 images) and Scale ($99/month, 1,000,000 images). Paid plans are monthly quota blocks with no automatic renewal lock-in. You can generate watermarked demo images for free without creating an account. Crypto checkout reduces card-processor friction for developers in the UAE, India, Nigeria, Pakistan, Brazil, and other regions where SaaS card billing is painful.`,
          'For an indie developer or small team shipping a Next.js app with a blog and a product page, OGKit Pro includes signed URLs and domain controls at a fraction of Bannerbear Scale — while staying focused on Open Graph cards only.',
        ],
      },
      {
        heading: 'How the developer workflow differs',
        paragraphs: [
          'With Bannerbear, you start in the template editor. You design visually, save, grab a template ID, then call the REST API with a modifications array. The API is asynchronous by default — you POST, poll for completion, then fetch your image URL. That is powerful for marketing automation but adds steps for a developer who only needs `og:image` to resolve to a real PNG.',
          `With OGKit, you build a URL server-side and drop it straight into your metadata. No polling, no webhook, no template editor session. Paste the docs into Cursor or Claude, generate the URL in one line, and ship.`,
        ],
      },
    ],
    code: `// Next.js App Router — metadata
import type { Metadata } from "next";

const url = new URL("${siteConfig.url}/api/og/article");
url.searchParams.set("key", process.env.OGKIT_KEY!);
url.searchParams.set("title", "How we reduced churn by 40%");
url.searchParams.set("author", "Sarah Chen");

export const metadata: Metadata = {
  openGraph: { images: [url.toString()] },
  twitter: { images: [url.toString()] },
};`,
    faq: [
      {
        question: 'Is OGKit a Bannerbear alternative for Next.js?',
        answer:
          'Yes. OGKit is built for developer use cases like Next.js App Router metadata, Astro frontmatter, and any stack where you construct an image URL server-side. Point `openGraph.images` at an OGKit URL — no template editor, no async polling for a simple OG card.',
      },
      {
        question: 'Does OGKit support signed URLs like Bannerbear?',
        answer:
          'Yes. OGKit includes signed URL support on paid plans (Pro and Scale). Bannerbear puts signed URLs behind the $149/month Scale plan.',
      },
      {
        question: 'Can I try OGKit without a credit card?',
        answer:
          'Yes. Use `demo=1` in any OGKit API URL or the Playground to generate watermarked preview images without payment details.',
      },
      {
        question: 'Why does OGKit use crypto checkout instead of cards?',
        answer:
          'Crypto checkout avoids card processor and regional billing blocks for developers outside the US and EU. OGKit is positioned for globally distributed indie teams from day one.',
      },
      {
        question: 'Is OGKit cheaper than Bannerbear?',
        answer:
          'For Open Graph image generation specifically, OGKit is typically cheaper at comparable developer needs: Bannerbear starts at $49/month with signed URLs on Scale at $149/month. OGKit Pro is $19/month with signed URLs included, plus a free watermarked tier for evaluation.',
      },
    ],
    closing:
      'OGKit turns one HTTPS URL into a 1200×630 Open Graph image. Use the docs and Playground to validate templates before you wire production keys.',
    links: [
      ['API docs', '/docs'],
      ['Playground', '/playground'],
      ['Pricing', '/pricing'],
      ['Dynamic social preview', '/use-case/dynamic-social-preview-images'],
    ],
  },
  'ogkit-vs-metashot': {
    h1: 'OGKit vs MetaShot',
    title: `OGKit vs MetaShot — crypto-native Open Graph image API`,
    description:
      'Compare OGKit and MetaShot for developer-focused Open Graph images, AI-assisted setup, crypto checkout, templates, signed URLs, and dynamic social previews.',
    intro:
      'MetaShot is a strong developer-first OG image API. OGKit takes a sharper angle for teams that want crypto-native checkout, AI-friendly docs, and a compact Open Graph image workflow.',
    statement:
      'Use MetaShot when custom SVG templates and live JSON data are your priority. Use OGKit when you want crypto-paid production quota, signed OG URLs, and an API contract optimized for AI-assisted developers.',
    rows: [
      ['Payment model', 'Crypto-native checkout for global developers.', 'Traditional SaaS pricing with free and paid tiers.'],
      ['Workflow', 'Template URL, Playground, llms.txt, and docs intended for Cursor/Claude-style implementation.', 'Template URL with edge cache, custom SVG templates, and data_url support.'],
      ['Security', 'API keys, quota, signed URLs, domain allowlists, and revocation controls.', 'API keys, signed URLs, and domain restrictions on paid plans.'],
      ['Best fit', 'AI-built SaaS, docs, launches, and indie products that prefer crypto checkout.', 'Teams that need uploaded SVG templates or live JSON-fed OG cards.'],
    ],
    ogkitFit: [
      'You want crypto-only checkout to be a feature, not an afterthought.',
      'Your implementation happens in Cursor, Claude, or another coding agent.',
      'You need reliable OG cards more than a broader template design system.',
    ],
    otherFit: [
      'You need custom SVG upload as the main template workflow.',
      'You need live JSON endpoint binding today.',
      'You prefer conventional card-based SaaS billing.',
    ],
    code: `${siteConfig.url}/api/og/minimal?demo=1&title=Hello+from+OGKit&theme=dark&accent=%232563eb`,
    links: [
      ['AI-friendly docs', '/llms.txt'],
      ['Try demo previews', '/playground'],
      ['Crypto pricing', '/pricing'],
    ],
  },
  'ogkit-vs-ogmagic': {
    h1: 'OGKit vs OGMagic',
    title: `OGKit vs OGMagic — production Open Graph image API`,
    description:
      'Compare OGKit and OGMagic for no-code previews, template count, API keys, crypto checkout, signed URLs, and production Open Graph image generation.',
    intro:
      'OGMagic is excellent when you want many inexpensive templates and a no-signup trial. OGKit is built for production teams that want API keys, quota visibility, crypto checkout, and controlled public URLs.',
    statement:
      'Use OGMagic when template variety and low one-time pricing matter most. Use OGKit when operational controls and global crypto-paid production usage matter more.',
    rows: [
      ['Template strategy', 'Focused templates for SaaS, docs, launch pages, products, and developer content.', 'Large template library with many visual styles.'],
      ['Trial experience', 'Watermarked demo URLs from the Playground without a key.', 'No-signup free API calls and visual editor.'],
      ['Production controls', 'API keys, quota, signed URLs, domain allowlists, revocation, and dashboard usage.', 'Simple license-key style access for higher usage.'],
      ['Positioning', 'Crypto-native, AI-friendly OG infrastructure for developer-owned sites.', 'Fast, template-heavy OG generator for indie developers.'],
    ],
    ogkitFit: [
      'You need production controls around public image URLs.',
      'Your team wants a crypto-native billing path.',
      'You want docs that AI coding agents can consume safely.',
    ],
    otherFit: [
      'You mainly want dozens of visual styles.',
      'You are optimizing for the cheapest possible entry price.',
      'You do not need signed URLs or domain-level controls.',
    ],
    code: `${siteConfig.url}/api/og/gradient?demo=1&title=Launch+notes&subtitle=Built+with+OGKit&pattern=dots`,
    links: [
      ['Open Playground', '/playground'],
      ['API reference', '/docs'],
      ['OGKit vs Vercel OG', '/compare/ogkit-vs-vercel-og'],
    ],
  },
  'ogkit-vs-placid': {
    h1: 'OGKit vs Placid',
    title: `OGKit vs Placid — Open Graph image API alternative`,
    description:
      'OGKit vs Placid: URL-first Open Graph images for Next.js vs creative automation, drag-and-drop editor, MCP, nocode workflows, and Placid Starter pricing from $39/month.',
    intro:
      'OGKit is a Placid alternative for developers who need Open Graph images from a URL — not a full creative automation suite with a drag-and-drop editor, video pipelines, MCP integrations, and nocode workflows. Placid is a mature platform used by marketing teams and agencies to generate images, PDFs, and videos at scale from dynamic templates. OGKit does one thing: turn a URL with parameters into a production-ready 1200×630 social preview card. If your use case is `og:image` for a Next.js app, SaaS product, blog, or docs site, OGKit gets you there in minutes without a template editor session.',
    statement:
      'Placid gives you REST and URL APIs, an editor, and MCP for AI-driven creative pipelines. OGKit is narrower: synchronous PNG URLs for metadata, signed URLs on paid tiers, and docs meant to paste into Cursor or Claude — no MCP or embedded editor to wire up when you only need share cards.',
    rows: [
      ['Primary use case', 'Open Graph and Twitter card images.', 'Images, video, PDF, creative automation.'],
      ['Setup time', 'Paste URL into `og:image` — done.', 'Design templates in the editor first.'],
      ['API style', 'URL-based, synchronous response, no SDK required.', 'REST API plus URL API.'],
      ['MCP support', 'No.', 'Yes — connect AI agents to templates.'],
      ['Editor SDK', 'No.', 'Yes — embed the editor into your app.'],
      ['No-login preview', 'Yes — watermarked demo without account (`demo=1`).', 'No — requires signup.'],
      ['Payment method', 'Crypto (global, no card processor).', 'Credit card only.'],
      ['Template editor', 'No — curated templates via API.', 'Yes — full drag-and-drop editor.'],
      ['Video generation', 'No.', 'Yes.'],
      ['PDF generation', 'No.', 'Yes.'],
      ['Zapier / Make / n8n', 'No.', 'Yes.'],
      ['Airtable integration', 'No.', 'Yes.'],
      ['Ghost integration', 'No.', 'Yes.'],
      ['Webflow integration', 'No.', 'Yes.'],
      ['Signed URLs', 'Yes — on Pro and Scale.', 'Yes — URL API (after template setup).'],
      ['Free trial', 'Watermarked demo images, no signup.', 'Free trial; signup required.'],
      ['Entry price', 'Free tier; Pro from $19/mo (crypto).', '$39/month (Starter).'],
    ],
    ogkitFit: [
      'You need Open Graph images for a Next.js, Astro, Rails, or Django app and want a hosted solution instead of maintaining `@vercel/og` routes yourself.',
      'Your team is global and credit card checkout is a blocker.',
      'You want to try before you buy — watermarked demos without signup or payment details.',
      'You want a simple, focused API with no editor overhead or nocode workflow configuration.',
      'You are building an AI-assisted app in Cursor or Claude and want docs you can paste directly into context.',
    ],
    otherFit: [
      'You need image and video and PDF generation from one platform.',
      'Your marketing team uses Zapier, Make, n8n, or Airtable to trigger asset generation without writing code.',
      'You need a drag-and-drop template editor for designers and non-developers.',
      'You are building AI agent workflows and want MCP integration with your creative templates.',
      'You need to embed a template editor directly into your own application via the Editor SDK.',
    ],
    sections: [
      {
        heading: 'Pricing comparison',
        paragraphs: [
          'Placid starts at $39/month for their Starter plan. Like most creative automation platforms, the full feature set — including higher volume, PDF generation, and team collaboration — typically means moving up tiers.',
          'Payment is credit card only, which can block developers in regions where Stripe or card processors create billing friction.',
          `OGKit uses crypto checkout (Cryptomus) for Pro ($19/month, 100,000 images) and Scale ($99/month, 1,000,000 images). Paid plans are monthly quota blocks with no automatic renewal lock-in. You can generate watermarked demo images for free without creating an account. For a developer shipping a Next.js SaaS or blog, that means a lower monthly floor than Placid Starter when you only need production Open Graph cards.`,
          'Crypto checkout also reduces card-processor friction for developers in the UAE, India, Nigeria, Pakistan, Brazil, and other regions where Stripe-dependent tools are harder to adopt.',
        ],
      },
      {
        heading: 'How the developer workflow differs',
        paragraphs: [
          'Placid gives you two paths. The REST API is template-first: you design in the editor, grab a template ID, POST a request with your dynamic values, and receive a rendered image URL. The URL API lets you pass parameters directly in a URL — closer to OGKit’s model — but you still need to create and configure templates in the editor before you can use either path.',
          'Placid has also launched an MCP integration so AI agents can connect directly to your templates. That is powerful for AI-assisted content workflows, but it is extra setup when you only need `og:image` to resolve to a real PNG.',
          'OGKit skips the editor entirely. You pick a template slug, build a URL server-side with your parameters, and drop it into your metadata. Synchronous response, cache-friendly, no polling, no webhook. Paste the docs into Cursor or Claude and ship in one session.',
        ],
      },
    ],
    code: `// Next.js App Router — metadata
import type { Metadata } from "next";

const url = new URL("${siteConfig.url}/api/og/article");
url.searchParams.set("key", process.env.OGKIT_KEY!);
url.searchParams.set("title", "How we cut infrastructure costs by 60%");
url.searchParams.set("author", "Alex Kim");
url.searchParams.set("subtitle", "Engineering");

export const metadata: Metadata = {
  openGraph: { images: [url.toString()] },
  twitter: { images: [url.toString()] },
};`,
    faq: [
      {
        question: 'Is OGKit a Placid alternative for Next.js?',
        answer:
          'Yes. OGKit targets developer use cases like Next.js App Router metadata, Astro frontmatter, and any stack where you build an image URL server-side. Point `openGraph.images` at an OGKit URL — no template editor, no REST polling for a simple card, and no MCP setup required.',
      },
      {
        question: 'Does OGKit have a URL API like Placid?',
        answer:
          'Yes. OGKit is URL-first: every template is a parameterized HTTPS URL that returns a 1200×630 PNG synchronously. You do not need a template editor session before the URL works.',
      },
      {
        question: 'Can I try OGKit without a credit card?',
        answer:
          'Yes. Use `demo=1` in any OGKit API URL or the Playground for watermarked previews without payment details. Placid requires signup before you generate your first image.',
      },
      {
        question: 'Why does OGKit use crypto checkout instead of cards?',
        answer:
          'Crypto checkout avoids card processor and regional billing blocks outside the US and EU. Placid and many SaaS tools rely on card rails like Stripe; OGKit is built so global developers who ship code can pay without that friction.',
      },
      {
        question: 'Is OGKit cheaper than Placid?',
        answer:
          'For Open Graph images specifically, usually yes: Placid Starter starts at $39/month. OGKit has a free watermarked tier and Pro at $19/month (crypto) with production quota and signed URLs — a better fit when share cards are the only output you need.',
      },
      {
        question: 'Does OGKit support AI agent workflows like Placid MCP?',
        answer:
          'Not today. Placid MCP targets teams that generate many varied creative assets from agents. OGKit stays focused on the simpler case: reliable `og:image` from one URL on any stack.',
      },
    ],
    closing:
      'OGKit turns one HTTPS URL into a 1200×630 Open Graph image. Read the API docs, try the Playground, or view pricing.',
    links: [
      ['API docs', '/docs'],
      ['Playground', '/playground'],
      ['Pricing', '/pricing'],
      ['Next.js guide', '/for/nextjs'],
    ],
  },
  'ogkit-vs-cloudinary': {
    h1: 'OGKit vs Cloudinary',
    title: `OGKit vs Cloudinary — focused Open Graph image API`,
    description:
      'Compare OGKit and Cloudinary for dynamic Open Graph images, media transformations, developer setup, and social preview card generation.',
    intro:
      'Cloudinary is a powerful media platform. OGKit is intentionally narrower: a hosted Open Graph image API for teams that want predictable social cards from simple URL parameters.',
    statement:
      'Use Cloudinary when you need a full media pipeline. Use OGKit when you need production-ready `og:image` URLs without designing transformation chains.',
    rows: [
      ['Scope', 'Open Graph and Twitter-card image generation only.', 'Broad media storage, transformations, delivery, and optimization.'],
      ['Setup', 'Pick a template, pass fields, use the returned PNG URL in metadata.', 'Design transformation URLs, overlays, asset rules, and delivery settings.'],
      ['Best fit', 'Developer docs, SaaS launches, changelogs, blogs, and public share pages.', 'Applications with complex media libraries and many asset transformations.'],
      ['Billing fit', 'Crypto-native paid quota for global developers.', 'Conventional cloud media billing.'],
    ],
    ogkitFit: ['You only need OG/social preview images.', 'You want simpler URLs.', 'You prefer crypto-native checkout.'],
    otherFit: ['You need image/video storage and delivery.', 'You already use Cloudinary as your media pipeline.', 'You need advanced transformations beyond social cards.'],
    code: `${siteConfig.url}/api/og/product?demo=1&title=Pro+Plan&price=%2419%2Fmo`,
    links: [
      ['Product launch images', '/use-case/product-launch'],
      ['API reference', '/docs'],
      ['Pricing', '/pricing'],
    ],
  },
  'ogkit-vs-ogforge': {
    h1: 'OGKit vs OGForge and OGPix',
    title: `OGKit vs OGForge and OGPix — production OG image API`,
    description:
      'Compare OGKit with free and low-cost Open Graph image APIs such as OGForge and OGPix for production social previews.',
    intro:
      'Free OG image APIs are great for experiments. OGKit is built for teams that want demo previews plus production controls when public image URLs become part of a real product.',
    statement:
      'Use free OG APIs for quick prototypes. Use OGKit when you need API keys, quota, crypto checkout, signed URLs, and a product surface your team can operate.',
    rows: [
      ['Entry point', 'No-key watermarked demo previews, then API-key production usage.', 'Often no signup or very low-cost API access.'],
      ['Controls', 'Quota, revocation, signed URLs, and domain allowlists.', 'Usually fewer production governance controls.'],
      ['Positioning', 'Focused developer SaaS for OG image infrastructure.', 'Lightweight generators for fast experiments.'],
      ['Best fit', 'Public share images attached to products, docs, and SaaS pages.', 'Side projects, tests, and low-risk pages.'],
    ],
    ogkitFit: ['You need operational controls.', 'You want crypto-paid production usage.', 'You need stable docs and dashboard workflows.'],
    otherFit: ['You need a completely free utility.', 'You do not need accounts, keys, or quota.', 'You are generating low-risk prototype images.'],
    code: `${siteConfig.url}/api/og/auto?demo=1&url=https%3A%2F%2Fexample.com`,
    links: [
      ['Try demo previews', '/playground'],
      ['API reference', '/docs'],
      ['Crypto pricing', '/pricing'],
    ],
  },
  'ogkit-vs-screenshot-apis': {
    h1: 'OGKit vs screenshot APIs',
    title: `OGKit vs screenshot APIs — social preview image generation`,
    description:
      'Compare OGKit with screenshot APIs for Open Graph images, dynamic social preview cards, speed, reliability, and metadata use cases.',
    intro:
      'OGKit is a screenshot API alternative when the image you need is a clean Open Graph card, not a screenshot of a whole webpage.',
    statement:
      'Screenshot APIs are powerful for capturing existing pages. OGKit is purpose-built for fast, branded social preview images that fit Open Graph and Twitter card dimensions.',
    rows: [
      ['Rendering target', 'Designed 1200x630 social card.', 'Viewport screenshot of a webpage or HTML document.'],
      ['Runtime cost', 'Template render without driving a full browser.', 'Often requires browser automation and page load timing.'],
      ['Reliability', 'Controlled fields and templates reduce layout drift.', 'Depends on page CSS, assets, cookies, load timing, and viewport.'],
      ['Use in metadata', 'Direct `og:image` URL for pages and docs.', 'Usually better for visual regression, website thumbnails, or receipts.'],
    ],
    ogkitFit: [
      'You want social cards, not page screenshots.',
      'You need stable previews for Slack, LinkedIn, X, Discord, and iMessage.',
      'You want images generated from title, author, logo, product, or changelog fields.',
    ],
    otherFit: [
      'You need to capture the actual page exactly as rendered.',
      'You are building website thumbnails or visual QA tools.',
      'You need arbitrary HTML rendering beyond OG card templates.',
    ],
    code: `<meta property="og:image" content="${siteConfig.url}/api/og/brand?key=KEY&title=Acme+Launch&tagline=Ship+faster" />
<meta name="twitter:image" content="${siteConfig.url}/api/og/brand?key=KEY&title=Acme+Launch&tagline=Ship+faster" />`,
    links: [
      ['Open Graph image API docs', '/docs'],
      ['SaaS social cards', '/use-case/saas'],
      ['Try templates', '/playground'],
    ],
  },
  'satori-vs-puppeteer': {
    h1: 'Satori vs Puppeteer for 1200×630 Open Graph images',
    title: `Satori vs Puppeteer for 1200×630 OG images — ${siteConfig.name}`,
    description:
      'Compare Satori, Puppeteer, and OGKit for generating Open Graph images, social preview cards, and dynamic 1200x630 PNG assets.',
    intro:
      'Satori and Puppeteer are both ways to render images, but they solve different problems. OGKit uses a fixed template approach so teams can generate Open Graph cards without owning either rendering pipeline directly.',
    statement:
      'Use Satori when you want React-to-image control. Use Puppeteer when you need real browser screenshots. Use OGKit when you want a hosted Open Graph image API with templates and predictable URLs.',
    rows: [
      ['Rendering model', 'Hosted templates backed by a controlled image pipeline.', 'Satori renders JSX-like layouts; Puppeteer renders full browser pages.'],
      ['Best for', 'Production social cards for metadata and sharing.', 'Custom image routes, browser screenshots, and advanced rendering needs.'],
      ['Operational burden', 'API keys, preview UI, quota, and templates are included.', 'You own fonts, layout limits, runtime cost, failures, and template QA.'],
      ['Output contract', '1200x630 PNG Open Graph images.', 'Whatever your route or browser capture pipeline produces.'],
    ],
    ogkitFit: [
      'You want Open Graph images, not a custom rendering engine.',
      'You need share cards from structured content fields.',
      'You prefer a stable API URL over rendering infrastructure.',
    ],
    otherFit: [
      'You need arbitrary custom layouts or full page screenshots.',
      'You already have a rendering team and debugging workflow.',
      'You need capabilities outside social preview images.',
    ],
    code: `// OGKit: one URL for metadata instead of a custom renderer
${siteConfig.url}/api/og/article?key=KEY&title=Satori+vs+Puppeteer&author=OGKit`,
    links: [
      ['OGKit vs screenshot APIs', '/compare/ogkit-vs-screenshot-apis'],
      ['OGKit vs Vercel OG', '/compare/ogkit-vs-vercel-og'],
      ['API reference', '/docs'],
    ],
  },
}

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { slug: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.slug)) return {}
  const c = COPY[params.slug]!
  const image = new URL(`${siteConfig.url}/api/og/minimal`)
  image.searchParams.set('demo', '1')
  image.searchParams.set('title', c.h1)
  image.searchParams.set('subtitle', 'Open Graph image API comparison')
  image.searchParams.set('accent', '#2563eb')
  const canonical = absoluteSiteUrl(`/compare/${params.slug}`)
  const description = clipMetaDescription(c.description)
  return {
    title: { absolute: c.title },
    description,
    alternates: { canonical },
    openGraph: { title: c.title, description, url: canonical, images: [image.toString()] },
    twitter: { card: 'summary_large_image', title: c.title, description, images: [image.toString()] },
  }
}

export default function ComparePage({ params }: Props) {
  if (!ALLOWED.has(params.slug)) notFound()
  const c = COPY[params.slug]!
  const faq =
    c.faq ??
    ([
      {
        question: `When should I choose OGKit for ${c.h1.replace('OGKit vs ', '').toLowerCase()}?`,
        answer: c.ogkitFit.join(' '),
      },
      {
        question: 'Is OGKit a screenshot API?',
        answer:
          'No. OGKit generates designed 1200x630 Open Graph cards from structured fields. Screenshot APIs capture rendered webpages or HTML.',
      },
      {
        question: 'Can I try OGKit without an API key?',
        answer: 'Yes. Use demo=1 in the Playground or API URL to generate watermarked evaluation images before creating a production key.',
      },
    ] satisfies { question: string; answer: string }[])
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
  const canonical = absoluteSiteUrl(`/compare/${params.slug}`)
  const breadcrumbLd = breadcrumbListJsonLd([
    { name: 'Compare', path: '/compare' },
    { name: c.h1, path: `/compare/${params.slug}` },
  ])
  const defaultGraph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      name: c.title,
      description: c.description,
      url: canonical,
      inLanguage: 'en',
      publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
    },
    {
      '@type': 'SoftwareApplication',
      name: siteConfig.name,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      url: absoluteSiteUrl(''),
      description:
        'Open Graph image API. Generate 1200×630 social preview cards from a plain HTTPS URL. Works with any framework or hosting platform.',
      offers: {
        '@type': 'Offer',
        price: '19',
        priceCurrency: 'USD',
        url: absoluteSiteUrl('/pricing'),
      },
    },
  ]
  const graphLd = {
    '@context': 'https://schema.org',
    '@graph':
      c.structuredDataGraph && c.structuredDataGraph.length > 0 ? c.structuredDataGraph : defaultGraph,
  }

  const comparisonTable = (
    <section>
      <h2 className="text-2xl font-semibold">Quick comparison</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 font-medium">Question</th>
              <th className="p-3 font-medium">OGKit</th>
              <th className="p-3 font-medium">Alternative</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map(([label, ogkit, other]) => (
              <tr key={label} className="border-b last:border-0">
                <td className="p-3 font-medium">{label}</td>
                <td className="p-3 text-muted-foreground">{ogkit}</td>
                <td className="p-3 text-muted-foreground">{other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const longSections = c.sections?.map((sec) => (
    <section key={sec.heading}>
      <h2 className="text-2xl font-semibold">{sec.heading}</h2>
      {(sec.paragraphs ?? []).map((para, i) => (
        <p key={`${sec.heading}-p-${i}`} className="mt-4 text-muted-foreground leading-relaxed">
          {para}
        </p>
      ))}
      {sec.bullets && sec.bullets.length > 0 ? (
        <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground leading-relaxed">
          {sec.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  ))

  return (
    <div className="container max-w-4xl space-y-12 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphLd) }} />

      <section>
        <p className="text-sm font-medium text-muted-foreground">Comparison</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{c.h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{c.intro}</p>
        <p className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">{c.statement}</p>
      </section>

      {c.sectionsAfterTable ? (
        <>
          {comparisonTable}
          {longSections}
        </>
      ) : (
        <>
          {longSections}
          {comparisonTable}
        </>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Choose OGKit if</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {c.ogkitFit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Choose the alternative if</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {c.otherFit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Example</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
          <code>{c.code}</code>
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className={`mt-4 grid gap-4 ${faq.length > 3 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {faq.map((item) => (
            <div key={item.question} className="rounded-lg border p-4">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {c.closing ? (
        <p className="text-muted-foreground leading-relaxed">{c.closing}</p>
      ) : null}

      <section>
        <h2 className="text-2xl font-semibold">Related pages</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {c.links.map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>
      <FinishCta />
    </div>
  )
}
