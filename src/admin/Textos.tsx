/**
 * Aba "Textos do site": tudo que é fixo no design (abertura, quem somos,
 * história, como ajudar, rodapé) e a diretoria pode reescrever.
 * A lista de campos vem de lib/textos.ts, a mesma que o site e a API usam.
 */
import { useEffect, useMemo, useState } from 'react'
import type { Foto } from '../content/fotos'
import { CAMPOS_TEXTO, type CampoTexto } from '../lib/textos'
import { api, type Midia } from './api'
import { SeletorFoto } from './Fotos'
import { Carregando, useAvisar } from './ui'

type Estado = { valores: Record<string, string>; fotos: Record<string, string> }

const SECOES = [...new Set(CAMPOS_TEXTO.map((c) => c.secao))]

function original(c: CampoTexto) {
  const v = c.ler()
  return typeof v === 'string' ? v : (v as Foto).src
}

export function PaginaTextos() {
  const [salvo, setSalvo] = useState<Estado | null>(null)
  const [rascunho, setRascunho] = useState<Record<string, string | null>>({})
  const [secao, setSecao] = useState(SECOES[0])
  const [seletor, setSeletor] = useState<CampoTexto | null>(null)
  const [previas, setPrevias] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const avisar = useAvisar()

  useEffect(() => {
    api<Estado>('/admin/textos')
      .then(setSalvo)
      .catch((e) => avisar(e.message, 'erro'))
  }, [avisar])

  const campos = useMemo(() => CAMPOS_TEXTO.filter((c) => c.secao === secao), [secao])
  const mudados = Object.keys(rascunho).filter((k) => CAMPOS_TEXTO.find((c) => c.chave === k)?.secao === secao)

  /** o que o campo mostra agora: rascunho, senão o salvo, senão o original */
  function valorAtual(c: CampoTexto): string {
    if (c.chave in rascunho) return rascunho[c.chave] ?? (c.tipo === 'foto' ? '' : original(c))
    return salvo?.valores[c.chave] ?? (c.tipo === 'foto' ? '' : original(c))
  }

  function urlDaFoto(c: CampoTexto) {
    if (c.chave in rascunho) return rascunho[c.chave] ? previas[c.chave] : original(c)
    return salvo?.fotos[c.chave] ?? original(c)
  }

  const personalizado = (c: CampoTexto) =>
    c.chave in rascunho ? rascunho[c.chave] !== null : !!salvo?.valores[c.chave]

  async function salvar() {
    const valores = Object.fromEntries(mudados.map((k) => [k, rascunho[k]]))
    setSalvando(true)
    try {
      await api('/admin/textos', { method: 'PUT', json: { valores } })
      const novo = await api<Estado>('/admin/textos')
      setSalvo(novo)
      setRascunho((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !mudados.includes(k))))
      avisar(`${secao}: salvo. Recarregue o site para ver.`)
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Textos do site</h2>
          <p className="pagina__descricao">
            Os textos e fotos fixos de cada seção. Campo que ninguém mexeu continua com o texto original do site.
          </p>
        </div>
        <a className="btn btn--fantasma" href="/" target="_blank" rel="noopener">
          Ver no site ↗
        </a>
      </header>

      <div className="segmentos segmentos--rolagem" role="tablist" aria-label="Seções do site">
        {SECOES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === secao}
            className="segmentos__item"
            onClick={() => setSecao(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {!salvo ? (
        <Carregando />
      ) : (
        <div className="cartao cartao--largo">
          {campos.map((c) => {
            const id = `texto-${c.chave}`
            const valor = valorAtual(c)
            const rotulo = (
              <span className="campo__rotulo campo__rotulo--linha">
                <span>{c.rotulo}</span>
                {personalizado(c) && (
                  <button
                    type="button"
                    className="link-pequeno"
                    onClick={() => setRascunho((r) => ({ ...r, [c.chave]: null }))}
                  >
                    voltar ao original
                  </button>
                )}
              </span>
            )

            if (c.tipo === 'foto') {
              return (
                <div key={c.chave} className="campo">
                  {rotulo}
                  <div className="foto-campo">
                    <img src={urlDaFoto(c)} alt="" className="foto-campo__previa" />
                    <div className="foto-campo__acoes">
                      <button type="button" className="btn btn--secundario" onClick={() => setSeletor(c)}>
                        Trocar foto
                      </button>
                      {c.dica && <span className="campo__dica">{c.dica}</span>}
                    </div>
                  </div>
                </div>
              )
            }

            const comum = {
              id,
              value: valor,
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setRascunho((r) => ({ ...r, [c.chave]: e.target.value })),
            }

            return (
              <label key={c.chave} className="campo" htmlFor={id}>
                {rotulo}
                {c.tipo === 'texto' ? (
                  <input type="text" maxLength={c.max} {...comum} />
                ) : (
                  <textarea
                    rows={c.tipo === 'linhas' ? (c.linhas ?? 3) : Math.min(8, Math.max(3, Math.ceil(c.max / 120)))}
                    maxLength={c.max}
                    {...comum}
                  />
                )}
                <span className="campo__dica campo__dica--linha">
                  <span>{c.dica ?? ''}</span>
                  <span className={valor.length > c.max * 0.9 ? 'campo__contador--cheio' : ''}>
                    {valor.length}/{c.max}
                  </span>
                </span>
              </label>
            )
          })}

          <div className="envio__acoes">
            {mudados.length > 0 && (
              <button type="button" className="btn btn--fantasma" onClick={() => setRascunho({})}>
                Descartar mudanças
              </button>
            )}
            <button type="button" className="btn btn--primario" disabled={!mudados.length || salvando} onClick={salvar}>
              {salvando ? 'Salvando…' : mudados.length ? `Salvar ${secao.toLowerCase()}` : 'Nada para salvar'}
            </button>
          </div>
        </div>
      )}

      {seletor && (
        <SeletorFoto
          atual={Number(valorAtual(seletor)) || null}
          aoFechar={() => setSeletor(null)}
          aoEscolher={(m: Midia) => {
            setRascunho((r) => ({ ...r, [seletor.chave]: String(m.id) }))
            setPrevias((p) => ({ ...p, [seletor.chave]: m.url }))
            setSeletor(null)
          }}
        />
      )}
    </section>
  )
}
