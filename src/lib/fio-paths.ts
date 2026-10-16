/**
 * Os paths do fio, um por seção.
 *
 * Todos vivem num `viewBox="0 0 100 100"` com `preserveAspectRatio="none"`,
 * ou seja, as coordenadas são porcentagens da largura e da altura da seção.
 * O traço não deforma porque o path usa `vector-effect="non-scaling-stroke"`.
 *
 * Continuidade: o x final do path de uma seção é o x inicial da seguinte.
 * Se algum dia não bater, ajustar o ponto inicial do path de baixo, nunca o
 * ponto final do de cima.
 *
 * Fontes:
 *   FIO_DESKTOP  = FIO.d do design aprovado para o desktop
 *   FIO_MOBILE   = FIO_M da prancha do fio
 *
 * Por que o mobile vem da prancha e não do FIO.m do desktop: o mobile é a
 * versão principal e o seu source desenha o fio a 20px da borda de 390px,
 * que é x = 5.1%. O FIO_M da prancha usa x = 5; o FIO.m do desktop usa x = 8
 * (31px), longe demais da borda. O FIO.m fica registrado abaixo para consulta.
 */

export type SecaoFio =
  | 'hero'
  | 'numeros'
  | 'quem'
  | 'historia'
  | 'diretoria'
  | 'atuacao'
  | 'projetos'
  | 'ajudar'

export const FIO_DESKTOP: Record<SecaoFio, string> = {
  // desce pela esquerda, passa por trás do título e sai pela base
  hero: 'M50 0 C50 14 26 12 14 24 C3 35 5 50 8 62 C11 74 24 79 44 79 C58 79 52 90 34 100',
  // entra no topo à esquerda, faz um S atrás dos números, sai na base à direita
  numeros: 'M34 0 C34 22 12 30 10 46 C8 62 40 60 60 62 C80 64 92 78 90 100',
  // passa atrás do título e entra atrás da foto com legenda
  quem: 'M90 0 C90 18 40 20 36 36 C32 52 10 58 12 76 C14 92 24 96 20 100',
  // no desktop a história é a timeline pinada: o path é gerado a partir da
  // largura real do trilho, em lib/timeline-path.ts
  historia: '',
  // serpenteia entre os retratos do mural
  diretoria: 'M80 0 C80 16 40 18 30 32 C20 46 72 50 72 62 C72 74 22 76 15 100',
  // a única vez que corre reto na horizontal, como divisor
  atuacao: 'M15 0 C15 22 15 42 32 45 C52 48 70 44 84 56 C96 66 90 88 85 100',
  // zigue-zague acompanhando o alinhamento alternado dos cards
  projetos: 'M85 0 C85 12 30 14 25 28 C20 42 78 40 76 56 C74 72 28 70 26 84 C24 94 42 96 50 100',
  /*
   * Valor de partida. O path real é recalculado em CoracaoDoFio.tsx a partir
   * da caixa do coração na tela, porque o fio tem que terminar exatamente na
   * fenda, e ela muda de lugar com a largura da janela.
   */
  ajudar: 'M50 0 C50 12 70 14 70 30',
}

export const FIO_MOBILE: Record<SecaoFio, string> = {
  hero: 'M50 0 C50 12 5 10 5 25 L5 100',
  numeros: 'M5 0 C5 20 88 22 88 35 C88 48 5 50 5 60 C5 70 85 72 85 82 C85 92 5 94 5 100',
  quem: 'M5 0 L5 38 C5 52 42 52 42 64 C42 76 5 76 5 86 L5 100',
  historia: 'M5 0 L5 100',
  diretoria: 'M5 0 L5 34 C5 44 30 44 60 44 L86 44 C96 44 96 60 86 60 L22 60 C8 60 5 66 5 74 L5 100',
  atuacao: 'M5 0 C5 30 13 40 13 50 C13 60 5 70 5 100',
  projetos: 'M5 0 C5 14 19 16 19 26 C19 36 12 38 12 48 C12 58 19 60 19 70 C19 80 5 84 5 100',
  ajudar: 'M5 0 C5 9 50 4 50 13.5',
}

/**
 * FIO.m do desktop/source.html, guardado para comparação.
 * Não usar: coloca o fio a 31px da borda no mobile, e o design manda 20px.
 */
export const FIO_MOBILE_DESKTOP_SOURCE: Record<SecaoFio, string> = {
  hero: 'M50 0 C50 14 12 14 8 30 C4 46 10 70 8 100',
  numeros: 'M8 0 C8 30 12 50 6 70 C3 84 8 92 8 100',
  quem: 'M8 0 C8 24 4 50 9 74 C11 88 8 94 8 100',
  historia: 'M8 0 C8 30 7 60 8 100',
  diretoria: 'M8 0 C8 26 5 52 9 76 C11 90 8 96 8 100',
  atuacao: 'M8 0 C8 30 6 60 8 100',
  projetos: 'M8 0 C8 24 5 50 8 74 C10 90 8 96 8 100',
  ajudar: 'M8 0 C8 6 50 6 50 12',
}

/** Espessura do traço, em px reais graças ao non-scaling-stroke. */
export const ESPESSURA = { desktop: 2, mobile: 1.5 } as const
