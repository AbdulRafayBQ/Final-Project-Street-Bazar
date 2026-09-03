// Street Bazar build: plain copy pipeline. No bundler, no framework.
// dist/ layout:  index.html · assets/** (css + js modules) · images/** · favicon.svg
import { cp, rm, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

await rm('dist', { recursive: true, force: true })
await mkdir('dist/assets', { recursive: true })

// app code & styles keep their folder so ./assets/... paths work as-is
await cp('assets', 'dist/assets', { recursive: true })

// public/ holds static media served from site root
if (existsSync('public')) await cp('public', 'dist', { recursive: true })

await cp('index.html', 'dist/index.html')

console.log('Street Bazar build complete -> dist/')
