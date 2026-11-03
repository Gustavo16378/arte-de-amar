import { FOTOS, type Foto } from './fotos'

/**
 * Projetos e campanhas. Copiado de PROJ (desktop/source.html), com os textos
 * curtos do mobile/source.html onde eles existem.
 *
 * Os dois primeiros têm `meta` [feito, total, unidade] e ganham a barra de
 * progresso feita com o fio.
 * TODO confirmar com a ONG os números das metas em andamento.
 */

export type Projeto = {
  nome: string
  objetivo: string
  /** versão curta, usada no mobile */
  objetivoCurto: string
  publico: string
  status: 'Em andamento' | 'Concluído'
  foto: Foto
  meta: [number, number, string] | null
  depoimento: string
  autor: string
  /** link do vídeo da campanha (YouTube, Instagram), cadastrado pelo painel */
  videoUrl?: string | null
}

export const PROJETOS: Projeto[] = [
  {
    nome: 'Dia das Crianças 2026',
    objetivo:
      'Um dia inteiro de brincadeira, lanche e um presente escolhido para cada criança da comunidade.',
    objetivoCurto:
      'Um dia inteiro de brincadeira, lanche e um presente escolhido para cada criança.',
    publico: 'Crianças de 2 a 12 anos',
    status: 'Em andamento',
    foto: { ...FOTOS.equipeLarBatista, posicao: '50% 40%' },
    meta: [112, 150, 'crianças'],
    depoimento:
      '“Meu filho não parou de falar da festa. Foi o primeiro presente que ele ganhou no ano.”',
    autor: 'Mãe atendida, 2025',
  },
  {
    nome: 'Volta às Aulas',
    objetivo:
      'Mochila completa e material escolar entregue em mãos antes do primeiro dia de aula.',
    objetivoCurto:
      'Mochila completa e material entregue em mãos antes do primeiro dia de aula.',
    publico: 'Estudantes da rede pública',
    status: 'Em andamento',
    foto: { ...FOTOS.heroMenino, posicao: '50% 30%' },
    meta: [86, 120, 'mochilas'],
    depoimento: '“Ele escolheu a mochila dos Minions e dormiu com ela do lado.”',
    autor: 'Avó atendida, 2026',
  },
  {
    nome: 'Ação de Páscoa',
    objetivo:
      'Ovos, brincadeiras e uma manhã de festa com apoio de motoclubes e voluntários da cidade.',
    objetivoCurto:
      'Ovos, brincadeiras e uma manhã de festa com motoclubes e voluntários da cidade.',
    publico: 'Crianças e famílias',
    status: 'Concluído',
    foto: { ...FOTOS.pascoaMotociclistas, posicao: '50% 50%' },
    meta: null,
    depoimento: '“Nunca vi tanta moto e tanta criança rindo no mesmo lugar.”',
    autor: 'Voluntária, 2025',
  },
  {
    nome: 'McDia Feliz',
    objetivo:
      'Venda de Big Macs em parceria com o McDonald’s, com renda destinada ao Hospital de Amor.',
    objetivoCurto: 'Big Macs vendidos com o McDonald’s, renda para o Hospital de Amor.',
    publico: 'Crianças em tratamento oncológico',
    status: 'Concluído',
    foto: { ...FOTOS.mcdiaFeliz, posicao: '50% 60%' },
    meta: null,
    depoimento: '“A fila deu a volta no quarteirão. A gente chorou.”',
    autor: 'Voluntário, 2024',
  },
  {
    nome: 'Natal Solidário',
    objetivo:
      'Brinquedo, roupa e ceia para que dezembro tenha mesa cheia e presente embaixo da árvore.',
    objetivoCurto: 'Brinquedo, roupa e ceia para dezembro ter mesa cheia.',
    publico: 'Famílias cadastradas',
    status: 'Concluído',
    foto: { ...FOTOS.doacoesNatal, posicao: '50% 50%' },
    meta: null,
    depoimento:
      '“Foi o primeiro Natal que eu não precisei explicar nada pros meninos.”',
    autor: 'Pai atendido, 2024',
  },
  {
    nome: 'SOS Rio Grande do Sul',
    objetivo:
      'Triagem e envio de roupas, água e alimentos para as famílias atingidas pela enchente.',
    objetivoCurto:
      'Triagem e envio de roupas, água e alimentos para as famílias atingidas pela enchente.',
    publico: 'Famílias desabrigadas no RS',
    status: 'Concluído',
    foto: { ...FOTOS.distribuicaoRoupas, posicao: '50% 40%' },
    meta: null,
    depoimento: '“Chegou uma caixa escrita ‘com amor, de Palmas’. Guardei o bilhete.”',
    autor: 'Família acolhida, 2024',
  },
]
