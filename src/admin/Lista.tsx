/**
 * Uma página de lista do painel (projetos, linha do tempo, diretoria,
 * números): itens na ordem do site, com reordenar, esconder, editar e
 * apagar. O formulário abre num painel lateral.
 */
import { useCallback, useEffect, useState } from 'react'
import { api, type Midia, type Registro } from './api'
import type { CampoForm, ConfigEntidade } from './config'
import { SeletorFoto } from './Fotos'
import { BotaoPerigoso, Carregando, useAvisar } from './ui'

type Rascunho = Record<string, unknown>

export function PaginaLista({ cfg }: { cfg: ConfigEntidade }) {
  const [itens, setItens] = useState<Registro[] | null>(null)
  const [editando, setEditando] = useState<Rascunho | null>(null)
  const avisar = useAvisar()

  const carregar = useCallback(async () => {
    try {
      const { itens } = await api<{ itens: Registro[] }>(`/admin/${cfg.rota}`)
      setItens(itens)
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }, [cfg.rota, avisar])

  useEffect(() => {
    setItens(null)
    setEditando(null)
    carregar()
  }, [carregar])

  async function mover(indice: number, direcao: -1 | 1) {
    if (!itens) return
    const alvo = indice + direcao
    if (alvo < 0 || alvo >= itens.length) return
    const nova = [...itens]
    ;[nova[indice], nova[alvo]] = [nova[alvo], nova[indice]]
    setItens(nova)
    try {
      await api(`/admin/${cfg.rota}/ordem`, { method: 'PUT', json: { ids: nova.map((i) => i.id) } })
    } catch (e) {
      avisar((e as Error).message, 'erro')
      carregar()
    }
  }

  async function alternarVisivel(item: Registro) {
    const visivel = item.visivel ? 0 : 1
    setItens((l) => l?.map((i) => (i.id === item.id ? { ...i, visivel } : i)) ?? null)
    try {
      await api(`/admin/${cfg.rota}/${item.id}`, { method: 'PUT', json: { visivel } })
      avisar(visivel ? 'Agora aparece no site.' : 'Escondido do site.')
    } catch (e) {
      avisar((e as Error).message, 'erro')
      carregar()
    }
  }

  async function apagar(item: Registro) {
    try {
      await api(`/admin/${cfg.rota}/${item.id}`, { method: 'DELETE' })
      setItens((l) => l?.filter((i) => i.id !== item.id) ?? null)
      setEditando(null)
      avisar(`${cfg.rotuloItem(item)} apagado.`)
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">{cfg.titulo}</h2>
          <p className="pagina__descricao">{cfg.descricao}</p>
        </div>
        <div className="pagina__acoes">
          <a className="btn btn--fantasma" href={`/${cfg.secao}`} target="_blank" rel="noopener">
            Ver no site ↗
          </a>
          <button type="button" className="btn btn--primario" onClick={() => setEditando({ ...cfg.vazio })}>
            + {cfg.novo}
          </button>
        </div>
      </header>

      {!itens ? (
        <Carregando />
      ) : itens.length === 0 ? (
        <p className="vazio">Nada por aqui ainda. Clique em “{cfg.novo}” para começar.</p>
      ) : (
        <ol className="lista">
          {itens.map((item, i) => (
            <li key={item.id} className={`linha ${item.visivel ? '' : 'linha--oculta'}`}>
              <div className="linha__ordem">
                <button
                  type="button"
                  className="btn-icone"
                  aria-label="Subir"
                  disabled={i === 0}
                  onClick={() => mover(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-icone"
                  aria-label="Descer"
                  disabled={i === itens.length - 1}
                  onClick={() => mover(i, 1)}
                >
                  ↓
                </button>
              </div>

              {'foto_id' in item &&
                (item.foto_url ? (
                  <img
                    className="linha__foto"
                    src={String(item.foto_url)}
                    alt=""
                    style={{ objectPosition: String(item.foto_posicao ?? '50% 50%') }}
                  />
                ) : (
                  <span className="linha__foto linha__foto--vazia" aria-hidden="true" />
                ))}

              <button type="button" className="linha__texto" onClick={() => setEditando({ ...item })}>
                <strong>{cfg.rotuloItem(item)}</strong>
                <span>{cfg.detalheItem(item)}</span>
              </button>

              <label className="chave" title="Mostrar no site">
                <input type="checkbox" checked={!!item.visivel} onChange={() => alternarVisivel(item)} />
                <span className="chave__trilho" aria-hidden="true" />
                <span className="chave__texto">{item.visivel ? 'No site' : 'Oculto'}</span>
              </label>
            </li>
          ))}
        </ol>
      )}

      {editando && (
        <Formulario
          cfg={cfg}
          inicial={editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={(salvo) => {
            setItens((l) => {
              if (!l) return l
              const existe = l.some((i) => i.id === salvo.id)
              return existe ? l.map((i) => (i.id === salvo.id ? { ...i, ...salvo } : i)) : [...l, salvo]
            })
            setEditando(null)
            carregar()
          }}
          aoApagar={editando.id ? () => apagar(editando as Registro) : undefined}
        />
      )}
    </section>
  )
}

function Formulario({
  cfg,
  inicial,
  aoFechar,
  aoSalvar,
  aoApagar,
}: {
  cfg: ConfigEntidade
  inicial: Rascunho
  aoFechar: () => void
  aoSalvar: (r: Registro) => void
  aoApagar?: () => void
}) {
  const [dados, setDados] = useState<Rascunho>(inicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [seletor, setSeletor] = useState<CampoForm | null>(null)
  const avisar = useAvisar()
  const novo = !inicial.id

  const mudar = (nome: string, valor: unknown) => setDados((d) => ({ ...d, [nome]: valor }))

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !seletor && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar, seletor])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)

    // manda só as colunas do formulário, nunca id, ordem ou foto_url
    const corpo: Rascunho = {}
    for (const g of cfg.grupos)
      for (const c of g.campos) {
        corpo[c.nome] = dados[c.nome] ?? null
        if (c.tipo === 'foto' && c.posicao) corpo[c.posicao] = dados[c.posicao] ?? '50% 50%'
      }

    try {
      const { item } = novo
        ? await api<{ item: Registro }>(`/admin/${cfg.rota}`, { method: 'POST', json: corpo })
        : await api<{ item: Registro }>(`/admin/${cfg.rota}/${inicial.id}`, { method: 'PUT', json: corpo })
      avisar(novo ? `${cap(cfg.singular)} criado.` : 'Alterações salvas.')
      aoSalvar(item)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="gaveta" role="dialog" aria-modal="true" aria-label={novo ? cfg.novo : `Editar ${cfg.singular}`}>
      <div className="gaveta__fundo" onClick={aoFechar} />
      <form className="gaveta__painel" onSubmit={salvar} noValidate>
        <header className="gaveta__topo">
          <h3>{novo ? cfg.novo : `Editar ${cfg.singular}`}</h3>
          <button type="button" className="btn btn--fantasma" onClick={aoFechar}>
            Fechar
          </button>
        </header>

        <div className="gaveta__corpo">
          {cfg.grupos.map((g, gi) => (
            <fieldset key={gi} className={`grupo ${g.lado ? 'grupo--lado' : ''}`}>
              {g.titulo && <legend className="grupo__titulo">{g.titulo}</legend>}
              {g.dica && <p className="grupo__dica">{g.dica}</p>}
              <div className="grupo__campos">
                {g.campos.map((c) => (
                  <Campo
                    key={c.nome}
                    campo={c}
                    dados={dados}
                    mudar={mudar}
                    abrirSeletor={() => setSeletor(c)}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <footer className="gaveta__rodape">
          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}
          <div className="gaveta__acoes">
            {aoApagar && (
              <BotaoPerigoso confirmar="Apagar mesmo?" aoConfirmar={aoApagar}>
                Apagar
              </BotaoPerigoso>
            )}
            <span className="espaco" />
            <button type="button" className="btn btn--fantasma" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primario" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </footer>
      </form>

      {seletor && (
        <SeletorFoto
          atual={(dados[seletor.nome] as number) ?? null}
          aoFechar={() => setSeletor(null)}
          aoEscolher={(m: Midia) => {
            setDados((d) => ({ ...d, [seletor.nome]: m.id, foto_url: m.url }))
            setSeletor(null)
          }}
        />
      )}
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** a altura do foco da foto, lida e escrita no formato "50% N%" */
function lerFoco(posicao: unknown) {
  const m = /50% (\d+)%/.exec(String(posicao ?? ''))
  return m ? Number(m[1]) : 50
}

function Campo({
  campo: c,
  dados,
  mudar,
  abrirSeletor,
}: {
  campo: CampoForm
  dados: Rascunho
  mudar: (nome: string, valor: unknown) => void
  abrirSeletor: () => void
}) {
  const valor = dados[c.nome]
  const id = `campo-${c.nome}`
  const obrigatorio = 'obrigatorio' in c && c.obrigatorio
  const rotulo = (
    <span className="campo__rotulo">
      {c.rotulo}
      {obrigatorio && <span className="campo__obrigatorio"> *</span>}
    </span>
  )
  const dica = 'dica' in c && c.dica ? <span className="campo__dica">{c.dica}</span> : null

  switch (c.tipo) {
    case 'texto':
    case 'url':
      return (
        <label className="campo" htmlFor={id}>
          {rotulo}
          <input
            id={id}
            type={c.tipo === 'url' ? 'url' : 'text'}
            value={String(valor ?? '')}
            maxLength={c.tipo === 'texto' ? c.max : 500}
            placeholder={c.tipo === 'url' ? 'https://' : undefined}
            onChange={(e) => mudar(c.nome, e.target.value)}
          />
          {dica}
        </label>
      )

    case 'area': {
      const texto = String(valor ?? '')
      return (
        <label className="campo" htmlFor={id}>
          {rotulo}
          <textarea id={id} rows={3} value={texto} maxLength={c.max} onChange={(e) => mudar(c.nome, e.target.value)} />
          <span className="campo__dica campo__dica--linha">
            <span>{'dica' in c ? c.dica : ''}</span>
            <span className={texto.length > c.max * 0.9 ? 'campo__contador--cheio' : ''}>
              {texto.length}/{c.max}
            </span>
          </span>
        </label>
      )
    }

    case 'numero':
      return (
        <label className="campo" htmlFor={id}>
          {rotulo}
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            value={valor === null || valor === undefined ? '' : String(valor)}
            onChange={(e) => mudar(c.nome, e.target.value === '' ? null : Number(e.target.value))}
          />
          {dica}
        </label>
      )

    case 'opcao':
      return (
        <div className="campo">
          {rotulo}
          <div className="segmentos" role="radiogroup" aria-label={c.rotulo}>
            {c.valores.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={valor === v}
                className="segmentos__item"
                onClick={() => mudar(c.nome, v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )

    case 'bool':
      return (
        <label className="campo campo--marcar">
          <input type="checkbox" checked={!!valor} onChange={(e) => mudar(c.nome, e.target.checked ? 1 : 0)} />
          <span>
            <span className="campo__rotulo">{c.rotulo}</span>
            {dica}
          </span>
        </label>
      )

    case 'foto': {
      const url = dados.foto_url as string | undefined
      const foco = c.posicao ? lerFoco(dados[c.posicao]) : 50
      return (
        <div className="campo">
          {rotulo}
          <div className="foto-campo">
            {valor && url ? (
              <img
                src={url}
                alt=""
                className="foto-campo__previa"
                style={{ objectPosition: `50% ${foco}%` }}
              />
            ) : (
              <span className="foto-campo__previa foto-campo__previa--vazia">sem foto</span>
            )}
            <div className="foto-campo__acoes">
              <button type="button" className="btn btn--secundario" onClick={abrirSeletor}>
                {valor ? 'Trocar foto' : 'Escolher foto'}
              </button>
              {valor && !obrigatorio ? (
                <button type="button" className="btn btn--fantasma" onClick={() => mudar(c.nome, null)}>
                  Tirar foto
                </button>
              ) : null}
              {c.posicao && valor ? (
                <label className="foco">
                  <span className="campo__dica">Enquadramento: arraste para escolher a parte que aparece</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={foco}
                    onChange={(e) => mudar(c.posicao!, `50% ${e.target.value}%`)}
                    aria-label="Enquadramento vertical da foto"
                  />
                  <span className="foco__rotulos" aria-hidden="true">
                    <span>topo</span>
                    <span>meio</span>
                    <span>base</span>
                  </span>
                </label>
              ) : null}
            </div>
          </div>
        </div>
      )
    }
  }
}
