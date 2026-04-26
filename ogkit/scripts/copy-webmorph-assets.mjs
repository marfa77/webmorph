import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', '..')
const publicDir = path.join(__dirname, '..', 'public')

function copyFile(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`[copy-webmorph-assets] skip (missing): ${from}`)
    return
  }
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
  console.log(`[copy-webmorph-assets] ${path.relative(root, to)}`)
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`[copy-webmorph-assets] skip dir (missing): ${from}`)
    return
  }
  fs.mkdirSync(to, { recursive: true })
  for (const name of fs.readdirSync(from)) {
    const s = path.join(from, name)
    const d = path.join(to, name)
    if (fs.statSync(s).isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
  console.log(`[copy-webmorph-assets] ${path.relative(root, to)}/`)
}

// Served at / via rewrite in next.config.mjs when using NEXT_PUBLIC_BASE_PATH=/ogkit
copyFile(path.join(root, 'index.html'), path.join(publicDir, 'webmorph.html'))
copyFile(path.join(root, 'favicon.svg'), path.join(publicDir, 'favicon.svg'))
for (const name of ['favicon.png', 'apple-touch-icon.png']) {
  const p = path.join(root, name)
  if (fs.existsSync(p)) copyFile(p, path.join(publicDir, name))
}
copyFile(path.join(root, 'og-image.jpg'), path.join(publicDir, 'og-image.jpg'))
copyFile(path.join(root, 'privacy.html'), path.join(publicDir, 'privacy.html'))
copyFile(path.join(root, 'terms.html'), path.join(publicDir, 'terms.html'))
copyFile(path.join(root, 'robots.txt'), path.join(publicDir, 'robots.txt'))
copyFile(path.join(root, 'sitemap.xml'), path.join(publicDir, 'sitemap.xml'))
copyFile(path.join(root, 'llms.txt'), path.join(publicDir, 'llms.txt'))
copyDir(path.join(root, 'previews'), path.join(publicDir, 'previews'))
copyDir(path.join(root, 'freelancer'), path.join(publicDir, 'freelancer'))
copyDir(path.join(root, 'restaurant'), path.join(publicDir, 'restaurant'))
copyDir(path.join(root, 'small-business'), path.join(publicDir, 'small-business'))
copyDir(path.join(root, 'startup'), path.join(publicDir, 'startup'))
