/**
 * O caminho do fio na linha do tempo pinada do desktop.
 *
 * Aqui o fio não é um path fixo em porcentagem como nas outras seções: ele
 * precisa ter a largura real do trilho, que depende de quantos marcos existem
 * e do tamanho da janela. Por isso é gerado, e não copiado.
 *
 * A lógica vem do `measure()` do design aprovado para o desktop: entra
 * a 20% da largura da janela, dobra para a horizontal no meio da altura,
 * ondula alternando acima e abaixo da linha, e no fim dobra para baixo a 20%
 * da borda direita.
 *
 * Com uma diferença: no source a onda tinha período fixo de 380px, que não
 * tem relação nenhuma com o espaçamento dos marcos. O fio cruzava o meio em
 * pontos arbitrários e os pontinhos de cada marco ficavam soltos, fora da
 * linha. Aqui a onda cruza o meio exatamente em cada marco, que é onde o
 * ponto está.
 *
 * O y é dado em porcentagem da altura e convertido para pixel: o SVG fica em
 * escala 1:1 com o palco, que é o que torna o desenho por stroke-dashoffset
 * exato. Veja lib/desenho.ts.
 *
 * 50% da altura é a linha do meio; 41 e 59 são as barrigas da onda.
 */
export function caminhoDaLinhaDoTempo(
  larguraTrilho: number,
  larguraJanela: number,
  altura: number,
  marcos: number[] = [],
) {
  const y = (pct: number) => ((pct / 100) * altura).toFixed(1)
  const x0 = larguraJanela * 0.2
  const x1 = larguraTrilho - larguraJanela * 0.2

  // desce da vertical e dobra para a horizontal
  let x = x0 + 120
  let d = `M${x0} ${y(0)} C${x0} ${y(25)} ${x0 + 40} ${y(40)} ${x} ${y(50)}`

  // ondula, cruzando o meio em cada marco
  let acima = true
  for (const marco of marcos) {
    if (marco <= x + 40 || marco >= x1 - 80) continue
    const barriga = y(acima ? 41 : 59)
    const recuo = (marco - x) * 0.35
    d += ` C${(x + recuo).toFixed(1)} ${barriga} ${(marco - recuo).toFixed(1)} ${barriga} ${marco} ${y(50)}`
    x = marco
    acima = !acima
  }

  // uma última barriga antes de dobrar, para não terminar reto
  if (x1 - 80 > x + 40) {
    const barriga = y(acima ? 41 : 59)
    const meio = (x + (x1 - 80)) / 2
    d += ` C${meio.toFixed(1)} ${barriga} ${meio.toFixed(1)} ${barriga} ${(x1 - 80).toFixed(1)} ${y(50)}`
    x = x1 - 80
  }

  // dobra de novo e desce, entregando o fio à Diretoria
  d += ` C${x1 - 40} ${y(50)} ${x1} ${y(72)} ${x1} ${y(100)}`
  return d
}

/**
 * Quanto o trilho anda na horizontal, e quanto de rolagem isso custa.
 * O fator 1.15 é o do source: dá um respiro a mais no fim do trajeto.
 */
export function medidasDaLinhaDoTempo(larguraTrilho: number, larguraJanela: number) {
  const percurso = Math.max(0, larguraTrilho - larguraJanela)
  return { percurso, rolagem: percurso * 1.15 }
}
