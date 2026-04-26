import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = {
  title: string
  subtitle?: string
  watermark: boolean
  accent?: string
  bg?: string
  font?: string
  pattern?: 'none' | 'dots' | 'grid'
  theme?: string
}

function patternBackground(pattern: Props['pattern'], bg: string, accent: string) {
  if (pattern === 'dots') return `radial-gradient(circle at 1px 1px, ${accent} 1px, transparent 0), ${bg}`
  if (pattern === 'grid') return `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px), ${bg}`
  return bg
}

export function MinimalTemplate({ title, subtitle, watermark, accent = '#2563eb', bg, font, pattern = 'none', theme }: Props) {
  const isDark = theme === 'dark'
  const background = bg ?? (isDark ? '#0a0a0a' : 'white')
  const foreground = isDark ? 'white' : '#0a0a0a'
  const muted = isDark ? '#a1a1aa' : '#52525b'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: patternBackground(pattern, background, accent),
        backgroundSize: pattern === 'none' ? 'auto' : '32px 32px',
        color: foreground,
        padding: 60,
        fontFamily: font ? `${font}, Inter, system-ui, sans-serif` : 'Inter, system-ui, sans-serif',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 28, color: muted, marginTop: 24, lineHeight: 1.4, maxWidth: 900 }}>{subtitle}</div>}
      <div style={{ width: 88, height: 6, borderRadius: 999, background: accent, marginTop: 34 }} />
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#a1a1aa' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
