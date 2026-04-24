import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; price?: string; image?: string; logo?: string; watermark: boolean }

export function ProductTemplate({ title, price, image, logo, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#fafafa',
        color: '#0a0a0a',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {image && (
        <div style={{ width: 420, height: '100%', display: 'flex' }}>
          <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ flex: 1, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
        {price && <div style={{ fontSize: 40, fontWeight: 600, color: '#16a34a', marginTop: 24 }}>{price}</div>}
      </div>
      {logo && (
        <div style={{ position: 'absolute', left: 32, bottom: 32 }}>
          <img src={logo} alt="" style={{ width: 120, height: 40, objectFit: 'contain' }} />
        </div>
      )}
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#a1a1aa' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
