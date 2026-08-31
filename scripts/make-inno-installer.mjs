// Builds the Windows installer with Inno Setup from the electron-builder
// unpacked output. Run after `electron-builder --win` (target: dir).
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const version = require('../package.json').version

const unpackedDir = join(root, 'dist', 'win-unpacked')
if (!existsSync(join(unpackedDir, 'Yachiyo.exe'))) {
  console.error('dist/win-unpacked/Yachiyo.exe not found — run "electron-builder --win" first')
  process.exit(1)
}

function findIscc() {
  const candidates = [
    process.env.INNO_SETUP_PATH,
    join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Inno Setup 6', 'ISCC.exe'),
    join(process.env.ProgramFiles || 'C:\\Program Files', 'Inno Setup 6', 'ISCC.exe'),
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Inno Setup 6', 'ISCC.exe')
  ].filter(Boolean)
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  try {
    return execFileSync('where', ['ISCC.exe'], { encoding: 'utf8' }).split(/\r?\n/)[0].trim()
  } catch {
    return null
  }
}

const iscc = findIscc()
if (!iscc) {
  console.error(
    'Inno Setup 6 not found. Install it (https://jrsoftware.org/isdl.php) or set INNO_SETUP_PATH to ISCC.exe.'
  )
  process.exit(1)
}

console.log('Compiling installer with', iscc)
execFileSync(iscc, [join(root, 'build', 'yachiyo.iss'), `/DAPP_VERSION=${version}`], {
  stdio: 'inherit'
})
console.log(`Installer: dist/installer/Yachiyo-${version}-setup.exe`)
