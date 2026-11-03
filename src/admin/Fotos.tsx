/**
 * Biblioteca de fotos: a página "Fotos" do painel e o seletor que abre de
 * dentro dos formulários. Os dois usam a mesma grade e o mesmo envio.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type Midia } from './api'
import { prepararFoto } from './upload'
import { BotaoPerigoso, Carregando, useAvisar } from './ui'

export function useMidias() {
  const [midias, setMidias] = useState<Midia[] | null>(null)
  const avisar = useAvisar()

  const recarregar = useCallback(async () => {
    try {
      const { itens } = await api<{ itens: Midia[] }>('/admin/midias')
      setMidias(itens)
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }, [avisar])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { midias, setMidias, recarregar }
}

/** botão de enviar foto: reduz no navegador, pede a descrição e sobe */
export function EnviarFoto({ aoEnviar }: { aoEnviar: (m: Midia) => void }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [pendente, setPendente] = useState<{ previa: string; pronta: Awaited<ReturnType<typeof prepararFoto>> } | null>(
    null,
  )
  const [alt, setAlt] = useState('')
  const avisar = useAvisar()

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    try {
      const pronta = await prepararFoto(arquivo)
      setPendente({ previa: URL.createObjectURL(pronta.arquivo), pronta })
      setAlt('')
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      if (entrada.current) entrada.current.value = ''
    }
  }

  async function subir() {
    if (!pendente) return
    setEnviando(true)
    try {
      const form = new FormData()
      const ext = pendente.pronta.arquivo.type === 'image/webp' ? 'webp' : 'jpg'
      form.append('arquivo', pendente.pronta.arquivo, `foto.${ext}`)
      form.append('alt', alt)
      form.append('largura', String(pendente.pronta.largura))
      form.append('altura', String(pendente.pronta.altura))
      const { item } = await api<{ item: Midia }>('/admin/midias', { method: 'POST', body: form })
      URL.revokeObjectURL(pendente.previa)
      setPendente(null)
      avisar('Foto enviada.')
      aoEnviar(item)
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      setEnviando(false)
    }
  }

  if (pendente) {
    return (
      <div className="envio">
        <img src={pendente.previa} alt="" className="envio__previa" />
        <div className="envio__campos">
          <label className="campo">
            <span className="campo__rotulo">Descreva a foto</span>
            <input
              autoFocus
              value={alt}
              maxLength={200}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Ex.: Crianças recebendo mochilas no Volta às Aulas"
            />
            <span className="campo__dica">É o que leitores de tela leem para quem não enxerga.</span>
          </label>
          <div className="envio__acoes">
            <button type="button" className="btn btn--fantasma" onClick={() => setPendente(null)} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primario" onClick={subir} disabled={enviando || alt.trim().length < 3}>
              {enviando ? 'Enviando…' : 'Enviar foto'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <label className="soltar">
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => escolher(e.target.files?.[0])}
      />
      <span className="soltar__titulo">Enviar uma foto nova</span>
      <span className="soltar__dica">JPG, PNG ou WebP. A gente reduz o tamanho antes de subir.</span>
    </label>
  )
}

function Grade({
  midias,
  selecionada,
  aoEscolher,
}: {
  midias: Midia[]
  selecionada?: number | null
  aoEscolher: (m: Midia) => void
}) {
  return (
    <ul className="grade">
      {midias.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            className="grade__item"
            aria-pressed={selecionada === m.id}
            onClick={() => aoEscolher(m)}
            title={m.alt}
          >
            <img src={m.url} alt={m.alt} loading="lazy" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/** modal aberto pelo campo de foto dos formulários */
export function SeletorFoto({
  atual,
  aoEscolher,
  aoFechar,
}: {
  atual: number | null
  aoEscolher: (m: Midia) => void
  aoFechar: () => void
}) {
  const { midias, setMidias } = useMidias()

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Escolher foto">
      <div className="modal__fundo" onClick={aoFechar} />
      <div className="modal__caixa">
        <header className="modal__topo">
          <h3>Escolher foto</h3>
          <button type="button" className="btn btn--fantasma" onClick={aoFechar}>
            Fechar
          </button>
        </header>
        <EnviarFoto
          aoEnviar={(m) => {
            setMidias((lista) => [m, ...(lista ?? [])])
            aoEscolher(m)
          }}
        />
        {midias ? <Grade midias={midias} selecionada={atual} aoEscolher={aoEscolher} /> : <Carregando />}
      </div>
    </div>
  )
}

/** a página "Fotos" do painel */
export function PaginaFotos() {
  const { midias, setMidias, recarregar } = useMidias()
  const [aberta, setAberta] = useState<Midia | null>(null)
  const [alt, setAlt] = useState('')
  const avisar = useAvisar()

  async function salvarAlt() {
    if (!aberta) return
    try {
      await api(`/admin/midias/${aberta.id}`, { method: 'PUT', json: { alt } })
      setMidias((l) => l?.map((m) => (m.id === aberta.id ? { ...m, alt } : m)) ?? null)
      avisar('Descrição salva.')
      setAberta(null)
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  async function apagar(m: Midia) {
    try {
      await api(`/admin/midias/${m.id}`, { method: 'DELETE' })
      avisar('Foto apagada.')
      setAberta(null)
      recarregar()
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Fotos</h2>
          <p className="pagina__descricao">
            Todas as fotos que o site pode usar. Envie aqui ou direto do formulário de um projeto.
          </p>
        </div>
      </header>

      <EnviarFoto aoEnviar={(m) => setMidias((l) => [m, ...(l ?? [])])} />

      {!midias ? (
        <Carregando />
      ) : (
        <Grade
          midias={midias}
          selecionada={aberta?.id}
          aoEscolher={(m) => {
            setAberta(m)
            setAlt(m.alt)
          }}
        />
      )}

      {aberta && (
        <div className="detalhe-foto">
          <img src={aberta.url} alt="" />
          <div className="detalhe-foto__info">
            <label className="campo">
              <span className="campo__rotulo">Descrição</span>
              <input value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} />
            </label>
            <p className="campo__dica">
              {aberta.largura} × {aberta.altura}px
              {aberta.estatica ? ' · faz parte do site original' : ` · ${Math.round(aberta.bytes / 1024)} KB`}
              {aberta.usos > 0 ? ` · em uso em ${aberta.usos} lugar${aberta.usos > 1 ? 'es' : ''}` : ''}
            </p>
            <div className="envio__acoes">
              <button type="button" className="btn btn--fantasma" onClick={() => setAberta(null)}>
                Fechar
              </button>
              {!aberta.estatica && (
                <BotaoPerigoso confirmar="Apagar mesmo?" aoConfirmar={() => apagar(aberta)}>
                  Apagar
                </BotaoPerigoso>
              )}
              <button type="button" className="btn btn--primario" onClick={salvarAlt}>
                Salvar descrição
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
