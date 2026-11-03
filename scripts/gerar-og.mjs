/**
 * Gera public/og-image.jpg, 1200x630, a partir da foto do hero com um véu
 * verde profundo, o logo em creme e a frase de abertura.
 *
 * Uso: npm run og
 * Fora do build de propósito: o arquivo pronto fica no Git, e gerar a cada
 * build reescrevia a imagem com bytes um pouco diferentes em cada sistema
 * (Windows e Linux), deixando o Git acusando mudança à toa. Rode só quando a
 * foto do hero ou a frase mudarem.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const L = 1200
const A = 630

const CORACAO = [
  'M 306.34 391.29 C 306.34 391.29 354.05 261.07 459.77 259.79 C 565.49 258.50 582.25 357.77 582.25 357.77 C 582.25 357.77 553.89 87.00 306.34 259.77 Z',
  'M 306.34 391.29 C 306.34 391.29 258.64 261.07 152.92 259.78 C 47.20 258.49 30.44 357.77 30.44 357.77 C 30.44 357.77 58.80 86.99 306.34 259.77 Z',
  'M 30.44 366.37 C 30.44 366.37 63.53 594.14 306.34 655.17 C 306.34 655.17 547.44 594.14 582.25 366.37 C 582.25 366.37 420.03 558.85 306.34 582.97 C 306.34 582.97 167.53 562.34 30.44 366.37',
].join('')

const camada = `
<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}">
  <defs>
    <linearGradient id="veu" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0B2E22" stop-opacity=".35"/>
      <stop offset="1" stop-color="#0B2E22" stop-opacity=".92"/>
    </linearGradient>
  </defs>
  <rect width="${L}" height="${A}" fill="url(#veu)"/>
  <g transform="translate(72 400) scale(.075)" fill="#F6F2EA">
    <path d="${CORACAO}"/>
    <circle cx="306" cy="184" r="39"/>
    <circle cx="306" cy="521" r="39"/>
  </g>
  <text x="122" y="446" font-family="Switzer, Helvetica, Arial, sans-serif" font-size="22"
        font-weight="500" letter-spacing="4.5" fill="#F6F2EA">ARTE DE AMAR</text>
  <text x="72" y="530" font-family="Sentient, Georgia, serif" font-size="56" fill="#F6F2EA">
    A arte de <tspan font-style="italic" fill="#6FE3B0">amar</tspan> é feita de pessoas.
  </text>
  <text x="72" y="576" font-family="Switzer, Helvetica, Arial, sans-serif" font-size="21"
        fill="#D9D2C3">ONG em Palmas, Tocantins, desde 2015</text>
</svg>`

// a foto é retrato 1600x2400: reduzimos para 1200 de largura e recortamos a
// faixa que deixa o rosto no terço superior, longe do texto do rodapé
await sharp(path.join(raiz, 'public/assets/fotos/hero-menino-mochila.jpg'))
  .resize({ width: L })
  .extract({ left: 0, top: 180, width: L, height: A })
  .modulate({ saturation: 1.05 })
  .composite([{ input: Buffer.from(camada), top: 0, left: 0 }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(raiz, 'public/og-image.jpg'))

console.log('public/og-image.jpg gerado em 1200x630')
