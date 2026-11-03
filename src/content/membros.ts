/**
 * Diretoria. Conteúdo de reserva: o que vale no ar é o que a diretoria
 * cadastra no painel (/admin), vindo do banco (migrations/0003_diretoria.sql).
 *
 * `coluna` e `recuo` são os valores do mural de 12 colunas do desktop.
 * `blob` é o índice da máscara orgânica em BLOBS (0 a 4).
 */

export type Membro = {
  nome: string
  cargo: string
  /** grid-column no mural desktop */
  coluna: string
  /** margin-top no mural desktop, para desalinhar */
  recuo: string
  blob: number
  foto: { src: string; alt: string; largura: number; altura: number } | null
}

export const MEMBROS: Membro[] = [
  { nome: 'Aline Milani', cargo: 'Presidente', coluna: '1 / 4', recuo: '0', blob: 0, foto: { src: '/assets/fotos/diretoria-aline-milani.jpg', alt: 'Aline Milani, presidente da Arte de Amar', largura: 960, altura: 1200 } },
  { nome: 'Larissa Lima', cargo: 'Vice-presidente', coluna: '5 / 8', recuo: '80px', blob: 1, foto: { src: '/assets/fotos/diretoria-larissa-lima.jpg', alt: 'Larissa Lima, vice-presidente da Arte de Amar', largura: 960, altura: 1200 } },
  { nome: 'Julia Belga', cargo: 'Tesoureira', coluna: '9 / 12', recuo: '24px', blob: 2, foto: { src: '/assets/fotos/diretoria-julia-belga.jpg', alt: 'Julia Belga, tesoureira da Arte de Amar', largura: 960, altura: 1200 } },
  { nome: 'Dayane Carvalho', cargo: 'Secretária', coluna: '2 / 5', recuo: '-40px', blob: 3, foto: { src: '/assets/fotos/diretoria-dayane-carvalho.jpg', alt: 'Dayane Carvalho, secretária da Arte de Amar', largura: 960, altura: 1200 } },
]
