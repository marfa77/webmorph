import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; subtitle?: string; watermark: boolean }

export function MinimalTemplate({ title, subtitle, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'white',
        color: '#0a0a0a',
        padding: 60,
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 28, color: '#52525b', marginTop: 24, lineHeight: 1.4, maxWidth: 900 }}>{subtitle}</div>}
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#a1a1aa' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
