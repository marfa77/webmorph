import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; author?: string; avatar?: string; watermark: boolean }

export function QuoteTemplate({ title, author, avatar, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, lineHeight: 1.35, fontWeight: 500, maxWidth: 1000 }}>“{title}”</div>
      {author && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 40, gap: 16 }}>
          {avatar && <img src={avatar} alt="" style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover' }} />}
          <div style={{ fontSize: 24, color: '#c7d2fe' }}>— {author}</div>
        </div>
      )}
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#6366f199' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
