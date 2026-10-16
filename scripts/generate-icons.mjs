// scripts/generate-icons.mjs
//
// Membuat SEMUA aset brand dari satu gambar sumber: brand/logo-source.png
// Jalankan:  npm run icons
//
// Gambar sumber diharapkan PNG transparan berisi satu figur.
// Batas figur dihitung otomatis dari piksel yang terisi (bukan angka tetap),
// jadi kalau suatu hari logonya diganti dengan komposisi serupa, skrip ini
// tetap bisa dipakai.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const SOURCE = 'brand/logo-source.png'

// Warna latar untuk ikon yang TIDAK boleh transparan (iOS, Android, OG).
// Sama dengan --moss di globals.css (hijau hutan).
const BRAND_BG = '#2f5c46'
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

// ---------------------------------------------------------------- util ---

async function readSource() {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Kotak pembatas piksel yang benar-benar terisi (alpha > 128)
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { width: info.width, height: info.height, minX, minY, maxX, maxY }
}

function clampBox(box, width, height) {
  const left = Math.max(0, Math.round(box.left))
  const top = Math.max(0, Math.round(box.top))
  return {
    left,
    top,
    width: Math.min(Math.round(box.width), width - left),
    height: Math.min(Math.round(box.height), height - top),
  }
}

async function write(file, pipeline) {
  await mkdir(path.dirname(file), { recursive: true })
  const buffer = await pipeline.toBuffer()
  await writeFile(file, buffer)
  console.log(`  ${file}  (${(buffer.length / 1024).toFixed(0)} KB)`)
  return buffer
}

// ---------------------------------------------------------------- main ---

const bounds = await readSource()
const figureW = bounds.maxX - bounds.minX
const figureH = bounds.maxY - bounds.minY

// Seluruh figur dengan sedikit ruang napas di kiri/kanan
const FULL_BOX = clampBox(
  {
    left: bounds.minX - figureW * 0.03,
    top: bounds.minY,
    width: figureW * 1.06,
    height: figureH + 1,
  },
  bounds.width,
  bounds.height
)

/**
 * Tile persegi berisi FIGUR PENUH (mahkota sampai bahu) di atas latar hijau
 * brand. Figur menempel rata ke tepi bawah tile, seperti foto profil.
 *   radius : kelengkungan pojok (0 = persegi penuh, untuk iOS/Android yang
 *            memotong sendiri; 0.22 = sama dengan logo aplikasi di Home)
 *   padTop : ruang kosong di atas mahkota (pecahan dari tinggi figur)
 *   padSide: ruang minimum kiri/kanan (pecahan dari lebar figur)
 *   solid  : false = latar transparan (tanpa kotak hijau, tanpa pojok bulat)
 */
async function tile(size, { radius = 0.22, padTop = 0.08, padSide = 0.06, solid = true } = {}) {
  const figure = await sharp(SOURCE).extract(FULL_BOX).toBuffer()
  const w = FULL_BOX.width
  const h = FULL_BOX.height
  const side = Math.max(h + Math.round(h * padTop), w + 2 * Math.round(w * padSide))
  const top = side - h
  const left = Math.floor((side - w) / 2)
  const right = side - w - left

  // Dua langkah terpisah: sharp selalu menjalankan resize SEBELUM extend dalam
  // satu pipeline, apa pun urutan pemanggilannya.
  const extended = await sharp(figure)
    .extend({ top, left, right, bottom: 0, background: TRANSPARENT })
    .toBuffer()
  const padded = await sharp(extended).resize(size, size, { fit: 'fill' }).toBuffer()

  let out = solid
    ? await sharp({
        create: { width: size, height: size, channels: 4, background: BRAND_BG },
      })
        .composite([{ input: padded }])
        .png()
        .toBuffer()
    : padded

  if (solid && radius > 0) {
    const r = (size * radius).toFixed(2)
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`
    )
    out = await sharp(out).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  }

  // Ukuran besar dikuantisasi ke palet supaya file kecil; ukuran kecil dibiarkan
  // penuh agar tepinya tajam.
  return sharp(out).png(
    size >= 128 ? { compressionLevel: 9, palette: true, quality: 90 } : { compressionLevel: 9 }
  )
}

console.log('Membuat aset brand dari', SOURCE)

// 1) Favicon & ikon tab ----------------------------------------------------
console.log('\nFavicon:')
// Favicon TRANSPARAN: hanya figurnya, tanpa kotak hijau.
const FAV = { solid: false, padTop: 0.02, padSide: 0.01 }
await write('src/app/icon.png', await tile(256, FAV))

const icoSizes = [16, 32, 48]
const icoPngs = await Promise.all(
  icoSizes.map(async (s) => (await tile(s, FAV)).toBuffer())
)
await mkdir('src/app', { recursive: true })
const ico = await pngToIco(icoPngs)
await writeFile('src/app/favicon.ico', ico)
console.log(`  src/app/favicon.ico  (${(ico.length / 1024).toFixed(0)} KB, ${icoSizes.join('/')} px)`)

// 2) Ikon layar utama iOS / Android -----------------------------------------
// Persegi penuh (radius 0): iOS & Android memotong pojoknya sendiri.
// Tetap berlatar hijau karena iOS/Android mengisi area transparan dengan
// hitam/putih.
console.log('\nApple / PWA:')
await write('src/app/apple-icon.png', await tile(180, { radius: 0 }))
await write('public/icon-192.png', await tile(192, { radius: 0 }))
await write('public/icon-512.png', await tile(512, { radius: 0 }))
// Maskable: Android memotongnya jadi lingkaran/squircle, jadi konten diberi
// ruang lebih supaya mahkota tidak terpotong oleh bentuk itu.
await write('public/icon-maskable-512.png', await tile(512, { radius: 0, padTop: 0.3, padSide: 0.3 }))

// 3) Logo untuk dipakai di dalam situs -------------------------------------
console.log('\nLogo situs:')
await write('public/brand/logo-mark.png', await tile(256))
await write(
  'public/brand/logo-full.png',
  sharp(SOURCE).extract(FULL_BOX).resize({ height: 900 }).png({ compressionLevel: 9, palette: true, quality: 92 })
)

// 4) Gambar pratinjau saat link dibagikan (WhatsApp, Telegram, X, dll) -----
console.log('\nOpen Graph:')
const OG_W = 1200
const OG_H = 630
// Gambar sumber memotong badan di tepi bawah (potongan rata), jadi figur
// ditempel rata ke tepi bawah kanvas: tampak "naik" dari bawah, bukan melayang.
const ogFigureBuffer = await sharp(SOURCE)
  .extract(FULL_BOX)
  .resize({ height: Math.round(OG_H * 0.93) })
  .png()
  .toBuffer()
const ogFigure = sharp(ogFigureBuffer)
const ogMeta = await ogFigure.metadata()
await write(
  'src/app/opengraph-image.png',
  sharp({ create: { width: OG_W, height: OG_H, channels: 4, background: BRAND_BG } })
    .composite([
      {
        input: ogFigureBuffer,
        left: Math.round((OG_W - ogMeta.width) / 2),
        top: OG_H - ogMeta.height,
      },
    ])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
)

console.log('\nSelesai.')