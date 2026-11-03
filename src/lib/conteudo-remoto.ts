/**
 * Conteúdo editável vindo da API (o painel em /admin grava no banco).
 *
 * Como funciona:
 * 1. main.tsx chama `carregarConteudo()` antes do primeiro render.
 * 2. Se a API responde a tempo, as listas de src/content (PROJETOS, MARCOS,
 *    MEMBROS, NUMEROS) e os contatos de SITE são trocados no lugar.
 * 3. Se a API demora, cai ou devolve algo estranho, nada muda: o site sobe
 *    com o conteúdo estático do código. O site nunca fica em branco por
 *    causa do backend.
 *
 * Trocar antes do render, e não depois com estado, é de propósito: as seções
 * medem o DOM para montar o GSAP (a linha do tempo pinada, o mural da
 * diretoria). Conteúdo chegando depois deixaria essas medidas erradas.
 *
 * O que a diretoria não escolhe (lado da foto, layout A/B do mobile, posição
 * no mural) é derivado da ordem, seguindo os mesmos padrões do design.
 */
import type { Foto } from '../content/fotos'
import { MARCOS, MARCOS_MOBILE, type Marco } from '../content/marcos'
import { MEMBROS, type Membro } from '../content/membros'
import { PROJETOS, type Projeto } from '../content/projetos'
import { NUMEROS, SITE, type Numero } from '../content/site'
import { aplicarTextos } from './textos'

type Remoto = {
  projetos: (Omit<Projeto, 'foto'> & { foto: Foto | null })[]
  marcos: (Omit<Marco, 'foto' | 'layout' | 'acima'> & { foto: Foto | null; soDesktop: boolean })[]
  membros: { nome: string; cargo: string; foto: Foto | null }[]
  numeros: { valor: number; sufixo: string; label: string }[]
  config: Record<string, string>
  /** textos e fotos fixos trocados no painel (ver lib/textos.ts) */
  textos?: Record<string, unknown>
}

/** os seis lugares do mural desktop, na ordem do design; repete depois do sexto */
const MURAL = MEMBROS.map(({ coluna, recuo }) => ({ coluna, recuo }))
/** velocidade do parallax e alinhamento de cada número, também do design */
const RITMO_NUMEROS = NUMEROS.map(({ velocidade, alinhamento }) => ({ velocidade, alinhamento }))

const TEMPO_MAXIMO = 2500

/** troca o conteúdo de um array sem trocar a referência que os componentes importaram */
function trocar<T>(lista: T[], novos: T[]) {
  lista.splice(0, lista.length, ...novos)
}

function valido(d: unknown): d is Remoto {
  if (!d || typeof d !== 'object') return false
  const r = d as Remoto
  return (
    Array.isArray(r.projetos) &&
    Array.isArray(r.marcos) &&
    Array.isArray(r.membros) &&
    Array.isArray(r.numeros) &&
    typeof r.config === 'object'
  )
}

function aplicar(r: Remoto) {
  trocar(
    PROJETOS,
    r.projetos.filter((p): p is Projeto => p.foto !== null),
  )

  const comFoto = r.marcos.filter((m) => m.foto !== null)
  const marcos: Marco[] = comFoto.map((m, i) => ({
    ano: m.ano,
    titulo: m.titulo,
    texto: m.texto,
    textoDesktop: m.textoDesktop,
    foto: m.foto as Foto,
    layout: 'A',
    // no desktop os marcos alternam acima e abaixo do fio
    acima: i % 2 === 0,
  }))
  // no mobile os layouts A e B alternam entre os marcos que aparecem lá
  const mobile = marcos.filter((_, i) => !comFoto[i].soDesktop)
  mobile.forEach((m, i) => (m.layout = i % 2 === 0 ? 'A' : 'B'))
  trocar(MARCOS, marcos)
  trocar(MARCOS_MOBILE, mobile)

  trocar(
    MEMBROS,
    r.membros.map<Membro>((m, i) => ({
      nome: m.nome,
      cargo: m.cargo,
      foto: m.foto,
      ...MURAL[i % MURAL.length],
      blob: i % 5,
    })),
  )

  trocar(
    NUMEROS,
    r.numeros.map<Numero>((n, i) => ({ ...n, ...RITMO_NUMEROS[i % RITMO_NUMEROS.length] })),
  )

  const whatsapp = r.config.whatsapp?.replace(/\D/g, '')
  if (whatsapp) {
    SITE.whatsappNumero = whatsapp
    SITE.whatsapp = `https://wa.me/${whatsapp}`
  }
  if (r.config.pix) SITE.pix = r.config.pix

  if (r.textos && typeof r.textos === 'object') aplicarTextos(r.textos)
}

export async function carregarConteudo() {
  const controle = new AbortController()
  const relogio = setTimeout(() => controle.abort(), TEMPO_MAXIMO)

  try {
    const resposta = await fetch('/api/conteudo', { signal: controle.signal })
    if (!resposta.ok) return false
    const dados: unknown = await resposta.json()
    if (!valido(dados)) return false
    aplicar(dados)
    return true
  } catch {
    // sem API (vite dev puro, rede ruim, backend fora): segue com o estático
    return false
  } finally {
    clearTimeout(relogio)
  }
}

/** POST do formulário "Ser voluntário". Devolve a mensagem de erro, ou null se deu certo. */
export async function enviarVoluntario(dados: { nome: string; whatsapp: string; como: string; site: string }) {
  try {
    const resposta = await fetch('/api/voluntarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
    if (resposta.ok) return null
    const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null
    // 4xx tem mensagem para a pessoa corrigir; outros erros caem no WhatsApp
    if (resposta.status >= 400 && resposta.status < 500 && corpo?.erro) return corpo.erro
    return 'offline'
  } catch {
    return 'offline'
  }
}
