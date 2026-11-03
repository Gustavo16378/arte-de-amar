/**
 * Catálogo das fotos da ONG, com dimensão real e texto alternativo.
 *
 * As chaves descrevem o que a foto mostra; `src` aponta para o arquivo em
 * public/assets/fotos/. Todo o resto do conteúdo referencia este catálogo,
 * para que largura, altura e alt fiquem num lugar só.
 *
 * equipe-mural.jpg e mcdia-feliz.jpg chegaram com o nome trocado no acervo
 * e foram renomeados no repositório: hoje cada nome bate com a foto.
 */

export type Foto = {
  src: string
  alt: string
  largura: number
  altura: number
  posicao?: string
}

export const FOTOS = {
  heroMenino: {
    src: '/assets/fotos/hero-menino-mochila.jpg',
    alt: 'Menino sorrindo com sua mochila nova',
    largura: 1600,
    altura: 2400,
  },
  equipeCirculo: {
    src: '/assets/fotos/equipe-circulo.jpg',
    alt: 'Voluntários e motociclistas reunidos em círculo na Ação de Páscoa',
    largura: 1800,
    altura: 2400,
  },
  equipeMural: {
    src: '/assets/fotos/equipe-mural.jpg',
    alt: 'Voluntárias e voluntários da Arte de Amar diante de um mural colorido',
    largura: 2400,
    altura: 1800,
  },
  mcdiaFeliz: {
    src: '/assets/fotos/mcdia-feliz.jpg',
    alt: 'Mesa coberta de Big Macs preparados para o McDia Feliz',
    largura: 1800,
    altura: 2400,
  },
  equipeLarBatista: {
    src: '/assets/fotos/equipe-lar-batista.jpg',
    alt: 'Equipe da Arte de Amar reunida no Lar Batista',
    largura: 1800,
    altura: 2400,
  },
  pascoaMotociclistas: {
    src: '/assets/fotos/pascoa-motociclistas.jpg',
    alt: 'Motociclistas com os ovos de Páscoa que vão entregar',
    largura: 1600,
    altura: 2844,
  },
  distribuicaoRoupas: {
    src: '/assets/fotos/distribuicao-roupas.jpg',
    alt: 'Famílias escolhendo roupas numa ação de distribuição',
    largura: 1200,
    altura: 1600,
  },
  doacoesNatal: {
    src: '/assets/fotos/doacoes-natal.jpg',
    alt: 'Alimentos, roupas e brinquedos separados para o Natal Solidário',
    largura: 960,
    altura: 540,
  },
  doacoesEnxovalBebe: {
    src: '/assets/fotos/doacoes-enxoval-bebe.jpg',
    alt: 'Enxoval de bebê montado com as doações recebidas',
    largura: 1280,
    altura: 720,
  },
  // as duas abaixo chegaram em 240x320 e ficam moles quando usadas
  // grandes. Pedir os originais à ONG.
  triagemRoupas: {
    src: '/assets/fotos/triagem-roupas.jpg',
    alt: 'Voluntárias fazendo a triagem de uma montanha de roupas doadas',
    largura: 240,
    altura: 320,
  },
  criancasComunidade: {
    src: '/assets/fotos/criancas-comunidade.jpg',
    alt: 'Crianças e famílias reunidas na comunidade durante uma ação',
    largura: 240,
    altura: 320,
  },
} as const satisfies Record<string, Foto>
