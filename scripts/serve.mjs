// Tiny static dev server for Street Bazar (no Vite).
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webp': 'image/webp' }

createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p === '/') p = '/index.html'
  
  const serveFile = async (filePath) => {
    const body = await readFile(filePath)
    res.writeHead(200, { 'content-type': TYPES[extname(filePath)] || 'application/octet-stream' })
    res.end(body)
  }

  let file = join(ROOT, p)
  let publicFile = join(ROOT, 'public', p)

  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    await serveFile(file)
  } catch {
    try {
      if ((await stat(publicFile)).isDirectory()) publicFile = join(publicFile, 'index.html')
      await serveFile(publicFile)
    } catch {
      try {
        const body = await readFile(join(ROOT, 'index.html'))
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end(body)
      } catch {
        res.writeHead(404)
        res.end('Not Found')
      }
    }
  }
}).listen(4173, () => console.log('Street Bazar running at http://localhost:4173'))
