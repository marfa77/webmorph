import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const ADOPTION_EVENTS = [
  'mcp_tool_called',
  'playground_demo_preview',
  'homepage_demo_preview',
  'demo_preview_generated',
  'api_key_created',
  'user_registered',
  'first_preview_generated',
  'og_image_generated',
] as const

export type AdoptionEventName = (typeof ADOPTION_EVENTS)[number]

export type AdoptionDayRow = {
  d: string
  event_name: string
  c: number
}

export type McpToolRow = {
  tool: string
  c: number
}

export type AdoptionReportData = {
  rows: AdoptionDayRow[]
  mcpTools: McpToolRow[]
  todayUtc: string
  yesterdayUtc: string
}

function utcDateString(offsetDays = 0): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function sumForDay(rows: AdoptionDayRow[], day: string, events?: string[]): number {
  return rows
    .filter((r) => r.d === day && (!events || events.includes(r.event_name)))
    .reduce((s, r) => s + r.c, 0)
}

function sumEvent(rows: AdoptionDayRow[], event: string, days?: string[]): number {
  return rows
    .filter((r) => r.event_name === event && (!days || days.includes(r.d)))
    .reduce((s, r) => s + r.c, 0)
}

const GOAL_PER_DAY = 10

/** Fetch adoption funnel aggregates for Telegram daily digest. */
export async function fetchAdoptionReportData(): Promise<AdoptionReportData> {
  const eventList = ADOPTION_EVENTS.map((e) => `'${e}'`).join(', ')

  const [rowsResult, toolsResult] = await Promise.all([
    db.execute(sql.raw(`
      SELECT DATE(created_at) AS d, event_name, COUNT(*) AS c
      FROM funnel_events
      WHERE event_name IN (${eventList})
        AND created_at > NOW() - INTERVAL 7 DAY
      GROUP BY d, event_name
      ORDER BY d DESC, event_name
    `)),
    db.execute(sql.raw(`
      SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(properties, '$.tool')), 'unknown') AS tool, COUNT(*) AS c
      FROM funnel_events
      WHERE event_name = 'mcp_tool_called'
        AND created_at > NOW() - INTERVAL 7 DAY
      GROUP BY tool
      ORDER BY c DESC
      LIMIT 5
    `)),
  ])

  const rows = (rowsResult[0] as Array<{ d: Date | string; event_name: string; c: number }>).map((r) => ({
    d: r.d instanceof Date ? r.d.toISOString().slice(0, 10) : String(r.d).slice(0, 10),
    event_name: r.event_name,
    c: Number(r.c),
  }))

  const mcpTools = (toolsResult[0] as Array<{ tool: string; c: number }>).map((r) => ({
    tool: String(r.tool),
    c: Number(r.c),
  }))

  return {
    rows,
    mcpTools,
    todayUtc: utcDateString(0),
    yesterdayUtc: utcDateString(-1),
  }
}

/** Telegram body: table + short Russian conclusions. */
export function formatAdoptionTelegramReport(data: AdoptionReportData): string {
  const { rows, mcpTools, todayUtc, yesterdayUtc } = data

  const lines: string[] = ['📊 OGKit adoption · 7 days', '']

  if (rows.length === 0) {
    lines.push('Событий нет — distribution не работает или трекинг сломан.')
    lines.push('')
    lines.push('→ Marketplace, cursor.directory, один пост с demo URL.')
    return lines.join('\n')
  }

  lines.push('date | event | count')
  for (const r of rows) {
    lines.push(`${r.d} | ${r.event_name} | ${r.c}`)
  }

  const mcpToday = sumForDay(rows, todayUtc, ['mcp_tool_called'])
  const mcpYesterday = sumForDay(rows, yesterdayUtc, ['mcp_tool_called'])
  const playgroundTodayTotal = sumForDay(rows, todayUtc, ['playground_demo_preview', 'homepage_demo_preview'])
  const playgroundYesterdayTotal = sumForDay(rows, yesterdayUtc, ['playground_demo_preview', 'homepage_demo_preview'])
  const siteDemo7d = sumEvent(rows, 'playground_demo_preview') + sumEvent(rows, 'homepage_demo_preview') + sumEvent(rows, 'demo_preview_generated')
  const mcp7d = sumEvent(rows, 'mcp_tool_called')
  const keys7d = sumEvent(rows, 'api_key_created')
  const registered7d = sumEvent(rows, 'user_registered')
  const keyedImages7d = sumEvent(rows, 'og_image_generated')

  lines.push('', '— Totals (7d) —')
  lines.push(`MCP calls: ${mcp7d}`)
  lines.push(`Site demos: ${siteDemo7d}`)
  lines.push(`API keys created: ${keys7d}`)
  lines.push(`Sign-ups: ${registered7d}`)
  lines.push(`Keyed OG images: ${keyedImages7d}`)

  if (mcpTools.length > 0) {
    lines.push('', 'Top MCP tools (7d):')
    for (const t of mcpTools) {
      lines.push(`• ${t.tool}: ${t.c}`)
    }
  }

  lines.push('', '💡 Выводы')

  const conclusions: string[] = []

  const mcpRefDay = mcpToday > 0 ? mcpToday : mcpYesterday
  const mcpRefLabel = mcpToday > 0 ? 'сегодня' : 'вчера'

  if (mcpRefDay >= GOAL_PER_DAY) {
    conclusions.push(`✅ Цель MCP (${GOAL_PER_DAY}+/день): ${mcpRefDay} ${mcpRefLabel}.`)
  } else if (mcp7d > 0) {
    conclusions.push(`⚠️ MCP ${mcpRefDay} ${mcpRefLabel} — ниже цели ${GOAL_PER_DAY}/день.`)
  } else {
    conclusions.push('❌ MCP: 0 за 7 дней — подключи Marketplace / cursor.directory / пост.')
  }

  const pgRef = playgroundTodayTotal > 0 ? playgroundTodayTotal : playgroundYesterdayTotal
  if (pgRef === 0 && mcp7d > 0) {
    conclusions.push('📡 Трафик идёт через Cursor MCP, сайт (Playground/homepage) почти не используют.')
  } else if (pgRef >= GOAL_PER_DAY) {
    conclusions.push(`✅ Site demos ${pgRef} ${playgroundTodayTotal > 0 ? 'сегодня' : 'вчера'} — цель достигнута.`)
  } else if (pgRef > 0) {
    conclusions.push(`↗️ Site demos ${pgRef} — есть интерес, усиль CTA на homepage.`)
  }

  if (mcpYesterday > 0 && mcpToday > 0) {
    const delta = mcpToday - mcpYesterday
    if (delta > 0) conclusions.push(`📈 MCP сегодня +${delta} vs вчера.`)
    else if (delta < 0) conclusions.push(`📉 MCP сегодня ${delta} vs вчера.`)
  }

  if (keys7d === 0 && mcp7d > 5) {
    conclusions.push('🔑 MCP работает, но ключей не создают — проверь onboarding / login CTA.')
  } else if (keys7d > 0 && keyedImages7d === 0) {
    conclusions.push('🚧 Ключи есть, prod OG images нет — пользователи не интегрируют.')
  } else if (keys7d > 0 && keyedImages7d > 0) {
    conclusions.push('🟢 Activation: ключи → реальные OG запросы.')
  }

  if (registered7d === 0 && mcp7d > 10) {
    conclusions.push('👤 Регистраций 0 — MCP бесплатный, signup не продают; ок для adoption-фазы.')
  }

  if (conclusions.length === 0) {
    conclusions.push('Данных мало — продолжай distribution, пересмотри через 2–3 дня.')
  }

  lines.push(...conclusions.map((c) => `• ${c}`))
  lines.push('', `🕐 ${new Date().toISOString()}`)

  return lines.join('\n')
}
