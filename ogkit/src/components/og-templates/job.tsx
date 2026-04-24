import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; company?: string; location?: string; logo?: string; watermark: boolean }

export function JobTemplate({ title, company, location, logo, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        color: '#0a0a0a',
        padding: 60,
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {logo && <img src={logo} alt="" style={{ width: 100, height: 40, objectFit: 'contain', marginBottom: 32 }} />}
      <div style={{ fontSize: 20, color: '#71717a', fontWeight: 500 }}>We are hiring</div>
      <div style={{ fontSize: 48, fontWeight: 800, marginTop: 12, lineHeight: 1.2 }}>{title}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 32, fontSize: 24, color: '#52525b' }}>
        {company && <span>{company}</span>}
        {company && location && <span>·</span>}
        {location && <span>{location}</span>}
      </div>
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#a1a1aa' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
