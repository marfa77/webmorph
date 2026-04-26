import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = {
  title: string
  subtitle?: string
  author?: string
  image?: string
  watermark: boolean
}

export function ArticleTemplate({ title, subtitle, author, image, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        color: 'white',
        padding: 60,
        position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 28, color: '#a1a1aa', marginTop: 20, lineHeight: 1.3 }}>{subtitle}</div>}
        {author && <div style={{ fontSize: 22, color: '#71717a', marginTop: 40 }}>{`by ${author}`}</div>}
      </div>
      {image && (
        <img
          src={image}
          alt=""
          style={{
            position: 'absolute',
            right: 60,
            bottom: 60,
            width: 140,
            height: 140,
            borderRadius: 70,
            objectFit: 'cover',
          }}
        />
      )}
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#52525b' }}>{OG_WATERMARK_TEXT}</div>
      )}
    </div>
  )
}
