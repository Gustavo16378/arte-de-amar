/**
 * Usuários do painel (com a recuperação de senha) e a auditoria.
 */
import { useCallback, useEffect, useState } from 'react'
import { api, type Usuario } from './api'
import { BotaoPerigoso, Carregando, useAvisar } from './ui'

type Pessoa = {
  id: number
  nome: string
  email: string
  trocar_senha: number
  criado_em: string
  ultimo_acesso: string | null
}

/** o D1 grava em UTC sem fuso: "2026-11-03 16:53:22" */
const dataDoBanco = (s: string) => new Date(s.replace(' ', 'T') + 'Z')
const paraBanco = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')

function quando(s: string | null) {
  if (!s) return 'nunca entrou'
  return dataDoBanco(s).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** caixa que mostra a senha temporária uma vez, com botão de copiar */
function SenhaGerada({ nome, senha, aoFechar }: { nome: string; senha: string; aoFechar: () => void }) {
  const [copiada, setCopiada] = useState(false)
  const mensagem = `Oi, ${nome.split(' ')[0]}! Sua senha temporária do painel da Arte de Amar é ${senha}. Entre em ${location.origin}/admin e crie uma senha nova.`
  return (
    <div className="cartao cartao--destaque" role="status">
      <h3 className="cartao__titulo">Senha temporária de {nome}</h3>
      <p className="senha-temporaria">{senha}</p>
      <p className="campo__dica">
        Ela aparece só agora. Mande para a pessoa: no primeiro login, o painel pede para ela criar uma senha nova.
      </p>
      <div className="envio__acoes envio__acoes--inicio">
        <button
          type="button"
          className="btn btn--primario"
          onClick={async () => {
            await navigator.clipboard.writeText(mensagem).catch(() => {})
            setCopiada(true)
          }}
        >
          {copiada ? 'Mensagem copiada' : 'Copiar mensagem para o WhatsApp'}
        </button>
        <button type="button" className="btn btn--fantasma" onClick={aoFechar}>
          Já mandei
        </button>
      </div>
    </div>
  )
}

export function PaginaUsuarios({ eu }: { eu: Usuario }) {
  const [pessoas, setPessoas] = useState<Pessoa[] | null>(null)
  const [nova, setNova] = useState({ nome: '', email: '' })
  const [gerada, setGerada] = useState<{ nome: string; senha: string } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const avisar = useAvisar()

  const carregar = useCallback(() => {
    api<{ itens: Pessoa[] }>('/admin/usuarios')
      .then((r) => setPessoas(r.itens))
      .catch((e) => avisar(e.message, 'erro'))
  }, [avisar])

  useEffect(carregar, [carregar])

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const r = await api<{ senhaTemporaria: string }>('/admin/usuarios', { method: 'POST', json: nova })
      setGerada({ nome: nova.nome, senha: r.senhaTemporaria })
      setNova({ nome: '', email: '' })
      carregar()
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function novaSenha(p: Pessoa) {
    try {
      const r = await api<{ senhaTemporaria: string }>(`/admin/usuarios/${p.id}`, { method: 'PUT' })
      setGerada({ nome: p.nome, senha: r.senhaTemporaria })
      carregar()
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  async function remover(p: Pessoa) {
    try {
      await api(`/admin/usuarios/${p.id}`, { method: 'DELETE' })
      avisar(`${p.nome} não tem mais acesso ao painel.`)
      carregar()
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Usuários</h2>
          <p className="pagina__descricao">
            Quem entra no painel. Se alguém esquecer a senha, gere uma senha temporária aqui e mande para a pessoa.
          </p>
        </div>
      </header>

      {gerada && <SenhaGerada nome={gerada.nome} senha={gerada.senha} aoFechar={() => setGerada(null)} />}

      {!pessoas ? (
        <Carregando />
      ) : (
        <ul className="voluntarios">
          {pessoas.map((p) => (
            <li key={p.id} className="voluntario">
              <div className="voluntario__topo">
                <strong>
                  {p.nome}
                  {p.id === eu.id && <span className="voce"> (você)</span>}
                </strong>
                {p.trocar_senha ? <span className="etiqueta">senha temporária</span> : null}
              </div>
              <p className="voluntario__meta">
                {p.email} · último acesso: {quando(p.ultimo_acesso)}
              </p>
              {p.id !== eu.id && (
                <div className="voluntario__acoes">
                  <BotaoPerigoso confirmar="Gerar mesmo?" aoConfirmar={() => novaSenha(p)} className="btn--suave">
                    Esqueceu a senha
                  </BotaoPerigoso>
                  <BotaoPerigoso confirmar={`Tirar acesso de ${p.nome.split(' ')[0]}?`} aoConfirmar={() => remover(p)}>
                    Tirar acesso
                  </BotaoPerigoso>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="cartao" onSubmit={criar}>
        <h3 className="cartao__titulo">Dar acesso a alguém</h3>
        <div className="grupo--lado grupo__campos">
          <label className="campo">
            <span className="campo__rotulo">Nome</span>
            <input value={nova.nome} maxLength={60} onChange={(e) => setNova({ ...nova, nome: e.target.value })} />
          </label>
          <label className="campo">
            <span className="campo__rotulo">E-mail</span>
            <input type="email" value={nova.email} onChange={(e) => setNova({ ...nova, email: e.target.value })} />
          </label>
        </div>
        <p className="campo__dica">O painel gera uma senha temporária para você mandar à pessoa.</p>
        <div className="envio__acoes">
          <button type="submit" className="btn btn--primario" disabled={salvando || nova.nome.trim().length < 2 || !nova.email}>
            {salvando ? 'Criando…' : 'Criar acesso'}
          </button>
        </div>
      </form>
    </section>
  )
}

/* ------------------------------------------------------------- auditoria */

type Registro = {
  id: number
  usuario_id: number | null
  usuario_nome: string
  acao: string
  area: string
  alvo: string
  detalhe: string
  criado_em: string
}

const AREA: Record<string, string> = {
  projetos: 'o projeto',
  marcos: 'o marco da linha do tempo',
  membros: 'a pessoa da diretoria',
  numeros: 'o número',
  fotos: 'a foto',
  voluntarios: 'o contato de voluntário',
  configuracoes: '',
  textos: 'os textos de',
  usuarios: '',
  painel: 'no painel',
}

const AREA_LISTA: Record<string, string> = {
  projetos: 'os projetos',
  marcos: 'a linha do tempo',
  membros: 'a diretoria',
  numeros: 'os números',
}

/** "Aline editou o projeto Natal Solidário" */
function frase(r: Registro) {
  const nome = r.usuario_nome.split(' ')[0]
  if (r.acao === 'entrou') return `${nome} entrou no painel`
  if (r.acao === 'reordenou') return `${nome} mudou a ordem de ${AREA_LISTA[r.area] ?? r.area}`
  if (r.area === 'voluntarios' && r.acao === 'apagou' && /^\d/.test(r.alvo)) return `${nome} apagou ${r.alvo}`
  if (r.acao === 'trocou' && r.area === 'usuarios') return `${nome} trocou ${r.alvo}`
  if (r.area === 'usuarios') return `${nome} ${r.acao === 'criou' ? 'deu acesso ao painel para' : 'tirou o acesso de'} ${r.alvo}`
  const artigo = AREA[r.area] ?? ''
  return `${nome} ${r.acao} ${artigo}${artigo ? ' ' : ''}${r.alvo}`.replace(/\s+/g, ' ').trim()
}

const hojeLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function PaginaAuditoria() {
  const [dia, setDia] = useState(hojeLocal)
  const [quem, setQuem] = useState('')
  const [itens, setItens] = useState<Registro[] | null>(null)
  const avisar = useAvisar()

  useEffect(() => {
    // o dia escolhido, de meia-noite a meia-noite no fuso de quem está olhando
    const [a, m, d] = dia.split('-').map(Number)
    const inicio = new Date(a, m - 1, d)
    const fim = new Date(a, m - 1, d + 1)
    setItens(null)
    api<{ itens: Registro[] }>(
      `/admin/auditoria?de=${encodeURIComponent(paraBanco(inicio))}&ate=${encodeURIComponent(paraBanco(fim))}`,
    )
      .then((r) => setItens(r.itens))
      .catch((e) => avisar(e.message, 'erro'))
  }, [dia, avisar])

  const pessoas = [...new Set(itens?.map((i) => i.usuario_nome) ?? [])]
  const visiveis = itens?.filter((i) => !quem || i.usuario_nome === quem)

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Auditoria</h2>
          <p className="pagina__descricao">
            Tudo que foi feito no painel em cada dia: quem fez, o quê e a que horas. Fica guardado por um ano.
          </p>
        </div>
        <div className="pagina__acoes">
          <label className="campo campo--compacto">
            <span className="campo__rotulo">Dia</span>
            <input type="date" value={dia} max={hojeLocal()} onChange={(e) => e.target.value && setDia(e.target.value)} />
          </label>
        </div>
      </header>

      {pessoas.length > 1 && (
        <div className="segmentos" role="radiogroup" aria-label="Filtrar por pessoa">
          <button type="button" role="radio" aria-checked={!quem} className="segmentos__item" onClick={() => setQuem('')}>
            Todo mundo
          </button>
          {pessoas.map((p) => (
            <button key={p} type="button" role="radio" aria-checked={quem === p} className="segmentos__item" onClick={() => setQuem(p)}>
              {p.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {!visiveis ? (
        <Carregando />
      ) : visiveis.length === 0 ? (
        <p className="vazio">Nada foi feito no painel nesse dia.</p>
      ) : (
        <ol className="auditoria">
          {visiveis.map((r) => (
            <li key={r.id} className={`registro registro--${r.acao}`}>
              <time className="registro__hora" dateTime={dataDoBanco(r.criado_em).toISOString()}>
                {dataDoBanco(r.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </time>
              <div className="registro__texto">
                <p>{frase(r)}</p>
                {r.detalhe && <span>{r.detalhe}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** tela obrigatória depois de entrar com senha temporária */
export function TrocaObrigatoria({ usuario, aoTrocar }: { usuario: Usuario; aoTrocar: () => void }) {
  const [senha, setSenha] = useState({ nova: '', repetir: '' })
  const [erro, setErro] = useState<string | null>(null)

  async function trocar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.nova !== senha.repetir) return setErro('As duas senhas novas não são iguais.')
    try {
      await api('/admin/senha', { method: 'PUT', json: { nova: senha.nova } })
      aoTrocar()
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  return (
    <main className="login">
      <div className="login__marca">
        <p className="login__frase">
          Oi, {usuario.nome.split(' ')[0]}. <em>Crie a sua senha.</em>
        </p>
      </div>
      <form className="login__caixa" onSubmit={trocar}>
        <h1 className="login__titulo">Senha nova</h1>
        <p className="campo__dica">Você entrou com uma senha temporária. Escolha uma só sua para continuar.</p>
        <label className="campo">
          <span className="campo__rotulo">Senha nova</span>
          <input type="password" autoComplete="new-password" minLength={10} required value={senha.nova} onChange={(e) => setSenha({ ...senha, nova: e.target.value })} />
          <span className="campo__dica">Pelo menos 10 caracteres.</span>
        </label>
        <label className="campo">
          <span className="campo__rotulo">Repita a senha nova</span>
          <input type="password" autoComplete="new-password" required value={senha.repetir} onChange={(e) => setSenha({ ...senha, repetir: e.target.value })} />
        </label>
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <button type="submit" className="btn btn--primario btn--largo" disabled={senha.nova.length < 10}>
          Salvar e entrar
        </button>
      </form>
    </main>
  )
}
