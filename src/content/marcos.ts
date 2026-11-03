import { FOTOS, type Foto } from './fotos'

/**
 * Linha do tempo. Copiado de MARCOS (desktop/source.html) e do objeto marcos
 * do mobile/source.html, que traz textos mais curtos e o object-position de
 * cada foto.
 *
 * O desktop mostra os sete marcos na timeline pinada.
 * O mobile mostra os seis primeiros, alternando dois layouts:
 *   A (índice par) ano na vertical à esquerda e foto sangrando à direita;
 *   B (índice ímpar) foto full-bleed com o ano em creme sobreposto.
 */

export type Marco = {
  ano: string
  titulo: string
  /** texto curto, usado no mobile */
  texto: string
  /** texto longo, usado no desktop */
  textoDesktop: string
  foto: Foto
  /** 'A' ou 'B', alternância do layout mobile */
  layout: 'A' | 'B'
  /** só no desktop: o marco fica acima ou abaixo do fio */
  acima: boolean
}

export const MARCOS: Marco[] = [
  {
    ano: '2015',
    titulo: 'A fundação',
    texto:
      'Um grupo de amigos decide que amar precisa virar ação. A primeira arrecadação sai da sala de casa.',
    textoDesktop:
      'Um grupo de amigos em Palmas decide que amar precisa virar ação. A primeira arrecadação sai da sala de casa.',
    foto: { ...FOTOS.triagemRoupas, posicao: '50% 50%' },
    layout: 'A',
    acima: true,
  },
  {
    ano: '2016',
    titulo: 'Primeira Volta às Aulas',
    texto: 'Mochilas e material para que nenhuma criança comece o ano sem o essencial.',
    textoDesktop:
      'Mochilas e material escolar para que nenhuma criança comece o ano sem o essencial.',
    foto: { ...FOTOS.criancasComunidade, posicao: '50% 30%' },
    layout: 'B',
    acima: false,
  },
  {
    ano: '2017',
    titulo: 'Primeiro Natal Solidário',
    texto: 'Brinquedos, roupas e ceia. O Natal vira campanha permanente.',
    textoDesktop:
      'Brinquedos, roupas e ceia. O Natal deixa de ser data e vira campanha permanente.',
    foto: { ...FOTOS.doacoesNatal, posicao: '50% 50%' },
    layout: 'A',
    acima: true,
  },
  {
    ano: '2022',
    titulo: 'McDia Feliz',
    texto: 'Com o McDonald’s e o Hospital de Amor, a corrente sai de Palmas.',
    textoDesktop:
      'A parceria com o McDonald’s e a Casa Ronald McDonald leva a corrente para além de Palmas.',
    foto: { ...FOTOS.mcdiaFeliz, posicao: '50% 60%' },
    layout: 'B',
    acima: false,
  },
  {
    ano: '2024',
    titulo: 'SOS Rio Grande do Sul',
    texto: 'Triagem, caixas e caminhão a dois mil quilômetros de distância.',
    textoDesktop:
      'Triagem, caixas e caminhão. A rede de Palmas responde à enchente a dois mil quilômetros de distância.',
    foto: { ...FOTOS.distribuicaoRoupas, posicao: '50% 40%' },
    layout: 'A',
    acima: true,
  },
  {
    ano: '2025',
    titulo: 'Dia das Crianças',
    texto: 'A maior festa até aqui, com o Lar Batista e dezenas de voluntários novos.',
    textoDesktop: 'A maior festa até aqui, com o Lar Batista e dezenas de voluntários novos.',
    foto: { ...FOTOS.equipeLarBatista, posicao: '50% 45%' },
    layout: 'B',
    acima: false,
  },
  {
    ano: 'Hoje',
    titulo: 'Onze anos de fio',
    texto:
      'Mais campanhas, mais parceiros e a mesma vontade de 2015. O próximo marco pode ter o seu nome.',
    textoDesktop:
      'Mais campanhas, mais parceiros e a mesma vontade de 2015. O próximo marco pode ter o seu nome.',
    foto: { ...FOTOS.heroMenino, posicao: '50% 25%' },
    layout: 'A',
    acima: true,
  },
]

/** O mobile mostra seis marcos; o sétimo ("Hoje") é exclusivo da timeline do desktop. */
export const MARCOS_MOBILE: Marco[] = MARCOS.slice(0, 6)
