import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; episode?: string; show?: string; image?: string; watermark: boolean }

export function PodcastTemplate({ title, episode, show, image, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#18181b',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {image && (
        <div style={{ width: 400, minHeight: 630, display: 'flex' }}>
          <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ flex: 1, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {show && <div style={{ fontSize: 18, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 2 }}>{show}</div>}
        <div style={{ fontSize: 44, fontWeight: 700, marginTop: 16, lineHeight: 1.2 }}>{title}</div>
        {episode && <div style={{ fontSize: 24, color: '#d4d4d8', marginTop: 20 }}>Episode {episode}</div>}
      </div>
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#52525b' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
