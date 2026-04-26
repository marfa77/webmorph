import { OG_WATERMARK_TEXT } from '@/config/og-constants'

type Props = { title: string; code?: string; language?: string; watermark: boolean }

export function DarkCodeTemplate({ title, code, language, watermark }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0c0c0c',
        color: '#e4e4e7',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        padding: 48,
        position: 'relative',
        borderTop: '4px solid #22c55e',
      }}
    >
      <div style={{ fontSize: 18, color: '#a1a1aa', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 20 }}>
        {language ? `${title} · ${language}` : title}
      </div>
      <div
        style={{
          flex: 1,
          background: '#18181b',
          borderRadius: 12,
          padding: 28,
          fontSize: 22,
          lineHeight: 1.5,
          color: '#d4d4d8',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: '1px solid #27272a',
        }}
      >
        {code || '// your code here'}
      </div>
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#52525b', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {OG_WATERMARK_TEXT}
        </div>
      )}
    </div>
  )
}
