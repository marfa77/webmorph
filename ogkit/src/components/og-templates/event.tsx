import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; date?: string; location?: string; image?: string; watermark: boolean }

export function EventTemplate({ title, date, location, image, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        background: image ? 'transparent' : '#f4f4f5',
        color: '#0a0a0a',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {image && <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: image ? 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3))' : 'transparent',
        }}
      />
      {date && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            background: '#ef4444',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          {date}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 60,
          width: '100%',
          color: image ? 'white' : '#0a0a0a',
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
        {location && <div style={{ fontSize: 24, marginTop: 16, opacity: 0.9 }}>{location}</div>}
      </div>
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: image ? '#ffffff99' : '#a1a1aa', zIndex: 2 }}>
          {OG_WATERMARK_TEXT}
        </div>
      )}
    </div>
  )
}
