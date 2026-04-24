import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; subtitle?: string; watermark: boolean }

function hueFromString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h) % 360
}

export function GradientTemplate({ title, subtitle, watermark }: Props) {
  const h = hueFromString(title)
  const bg = `linear-gradient(135deg, hsl(${h}, 70%, 45%) 0%, hsl(${(h + 40) % 360}, 65%, 35%) 100%)`
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 60,
        background: bg,
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, textShadow: '0 2px 24px rgba(0,0,0,0.25)' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 28, marginTop: 20, opacity: 0.95, lineHeight: 1.35, textShadow: '0 1px 12px rgba(0,0,0,0.2)' }}>
          {subtitle}
        </div>
      )}
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
