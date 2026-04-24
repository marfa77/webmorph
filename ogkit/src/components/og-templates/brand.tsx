import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; tagline?: string; logo?: string; watermark: boolean }

export function BrandTemplate({ title, tagline, logo, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0a0a0a',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        textAlign: 'center',
        padding: 60,
      }}
    >
      {logo && <img src={logo} alt="" style={{ maxWidth: 200, maxHeight: 100, objectFit: 'contain', marginBottom: 32 }} />}
      <div style={{ fontSize: 40, fontWeight: 700 }}>{title}</div>
      {tagline && <div style={{ fontSize: 24, color: '#a1a1aa', marginTop: 20, maxWidth: 900 }}>{tagline}</div>}
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#52525b' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
