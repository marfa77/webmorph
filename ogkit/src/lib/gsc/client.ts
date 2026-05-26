import { google } from 'googleapis'
import {
  getGscSiteUrl,
  getGscSitemapUrl,
  gscScope,
  isGscConfigured,
  parseGscServiceAccount,
} from '@/lib/gsc/config'

export type GscAnalyticsRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type GscAnalyticsSummary = {
  siteUrl: string
  startDate: string
  endDate: string
  totals: { clicks: number; impressions: number; ctr: number; position: number }
  topQueries: GscAnalyticsRow[]
  topPages: GscAnalyticsRow[]
}

async function getSearchConsoleClient() {
  const credentials = parseGscServiceAccount()
  if (!credentials) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON is missing or invalid')
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [gscScope()],
  })
  return google.searchconsole({ version: 'v1', auth })
}

export async function listGscSites(): Promise<string[]> {
  const sc = await getSearchConsoleClient()
  const res = await sc.sites.list()
  return (res.data.siteEntry ?? []).map((s) => s.siteUrl ?? '').filter(Boolean)
}

export async function submitGscSitemap(): Promise<{ siteUrl: string; sitemapUrl: string }> {
  const sc = await getSearchConsoleClient()
  const siteUrl = getGscSiteUrl()
  const sitemapUrl = getGscSitemapUrl()
  await sc.sitemaps.submit({ siteUrl, feedpath: sitemapUrl })
  return { siteUrl, sitemapUrl }
}

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function aggregateRows(
  rows: Array<{ keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null }>,
): GscAnalyticsRow[] {
  return rows.map((r) => ({
    keys: r.keys ?? [],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }))
}

function totalsFromRows(rows: GscAnalyticsRow[]) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0)
  const impressions = rows.reduce((s, r) => s + r.impressions, 0)
  const ctr = impressions > 0 ? clicks / impressions : 0
  const position =
    rows.length > 0 ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / Math.max(impressions, 1) : 0
  return { clicks, impressions, ctr, position }
}

export async function fetchGscAnalyticsSummary(days = 28): Promise<GscAnalyticsSummary> {
  const sc = await getSearchConsoleClient()
  const siteUrl = getGscSiteUrl()
  const endDate = isoDateDaysAgo(3)
  const startDate = isoDateDaysAgo(days + 3)

  const baseBody = {
    startDate,
    endDate,
    rowLimit: 10,
    dataState: 'final' as const,
  }

  const [queryRes, pageRes, totalRes] = await Promise.all([
    sc.searchanalytics.query({
      siteUrl,
      requestBody: { ...baseBody, dimensions: ['query'] },
    }),
    sc.searchanalytics.query({
      siteUrl,
      requestBody: { ...baseBody, dimensions: ['page'] },
    }),
    sc.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, rowLimit: 1 },
    }),
  ])

  const topQueries = aggregateRows(queryRes.data.rows ?? [])
  const topPages = aggregateRows(pageRes.data.rows ?? [])
  const totalRows = aggregateRows(totalRes.data.rows ?? [])

  return {
    siteUrl,
    startDate,
    endDate,
    totals: totalRows[0]
      ? {
          clicks: totalRows[0].clicks,
          impressions: totalRows[0].impressions,
          ctr: totalRows[0].ctr,
          position: totalRows[0].position,
        }
      : totalsFromRows([...topQueries, ...topPages]),
    topQueries,
    topPages,
  }
}

export { isGscConfigured }
