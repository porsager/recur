const fs = require('fs')
    , path = require('path')

const root = process.argv[2] || 'src'

!fs.existsSync('cjs') && fs.mkdirSync('cjs')
fs.readdirSync(root).forEach(name =>
  fs.writeFileSync(
    path.join('cjs', name),
    fs.readFileSync(path.join(root, name), 'utf8')
      .replace(/export default function ([^(]+)/, 'module.exports = $1;function $1')
      .replace(/export default /, 'module.exports = ')
      .replace(/export const ([a-z0-9_$]+)/gi, 'const $1 = module.exports.$1')
      .replace(/export function ([a-z0-9_$]+)/gi, 'module.exports.$1 = function $1')
      .replace(/export ({[^{}]*?})/gi, 'Object.assign(module.exports, $1)')
      .replace(/import {([^{}]*?)} from (['"].*?['"])/gi, 'const {$1} = require($2)')
      .replace(/import (.*?) from (['"].*?['"])/gi, 'const $1 = require($2)')
  )
)
fs.writeFileSync(path.join('cjs', 'package.json'), '{"type":"commonjs"}')
