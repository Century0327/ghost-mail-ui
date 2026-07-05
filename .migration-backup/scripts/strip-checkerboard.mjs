// 从四角泛洪填充，把生成图里"烤进去"的棋盘格背景（白 + 浅灰交替）转成真透明。
// 猫/物品的深色描边会挡住泛洪，因此内部的浅色不会被误删。
import { PNG } from 'pngjs'
import { readFileSync, writeFileSync } from 'node:fs'

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: node strip-checkerboard.mjs <file.png> ...')
  process.exit(1)
}

// 棋盘格是纯灰阶（黑/深灰/浅灰，r≈g≈b）。猫与物品是暖色且有饱和的深色描边，
// 因此只要判断"接近纯灰阶"即可，泛洪会在描边处停止，内部浅色不受影响。
function isBg(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min <= 18
}

for (const file of files) {
  const png = PNG.sync.read(readFileSync(file))
  const { width, height, data } = png
  const idx = (x, y) => (y * width + x) * 4
  const visited = new Uint8Array(width * height)
  const stack = []

  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (visited[p]) return
    const i = p * 4
    if (!isBg(data[i], data[i + 1], data[i + 2])) return
    visited[p] = 1
    stack.push(x, y)
  }

  // 从四条边界启动泛洪
  for (let x = 0; x < width; x++) {
    pushIf(x, 0)
    pushIf(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    pushIf(0, y)
    pushIf(width - 1, y)
  }

  while (stack.length) {
    const y = stack.pop()
    const x = stack.pop()
    const i = idx(x, y)
    data[i + 3] = 0 // 设为透明
    pushIf(x + 1, y)
    pushIf(x - 1, y)
    pushIf(x, y + 1)
    pushIf(x, y - 1)
  }

  writeFileSync(file, PNG.sync.write(png))
  console.log(`stripped: ${file}`)
}
