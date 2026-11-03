/**
 * Painel da diretoria (/admin). Entrada separada do site no build: quem
 * visita a ONG não baixa nada daqui, e o painel não carrega GSAP.
 */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { api, quandoSessaoExpirar, type Usuario } from './api'
import { ENTIDADES } from './config'
import { PaginaFotos } from './Fotos'
import { PaginaLista } from './Lista'
import { PaginaConfiguracoes, PaginaVoluntarios } from './Paginas'
import { Carregando, Coracao, ProvedorAvisos, useAvisar } from './ui'
import '../styles/fonts.css'
import './admin.css'

type Aba = (typeof ENTIDADES)[number]['rota'] | 'fotos' | 'voluntarios' | 'configuracoes'

const ABAS: { id: Aba; rotulo: string }[] = [
  ...ENTIDADES.map((e) => ({ id: e.rota, rotulo: e.titulo })),
  { id: 'fotos', rotulo: 'Fotos' },
  { id: 'voluntarios', rotulo: 'Voluntários' },
  { id: 'configuracoes', rotulo: 'Configurações' },
]

function abaDaUrl(): Aba {
  const h = location.hash.replace('#', '') as Aba
  return ABAS.some((a) => a.id === h) ? h : 'projetos'
}

function Login({ aoEntrar }: { aoEntrar: (u: Usuario) => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setEntrando(true)
    setErro(null)
    try {
      const { usuario } = await api<{ usuario: Usuario }>('/auth/login', { method: 'POST', json: { email, senha } })
      aoEntrar(usuario)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEntrando(false)
    }
  }

  return (
    <main className="login">
      <div className="login__marca">
        <span className="login__logo">
          <Coracao tamanho={56} />
        </span>
        <p className="login__nome">Arte de Amar</p>
        <p className="login__frase">
          O site é feito de pessoas. <em>Esta parte é de vocês.</em>
        </p>
      </div>
      <form className="login__caixa" onSubmit={entrar}>
        <h1 className="login__titulo">Painel da diretoria</h1>
        <label className="campo">
          <span className="campo__rotulo">E-mail</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="campo">
          <span className="campo__rotulo">Senha</span>
          <input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <button type="submit" className="btn btn--primario btn--largo" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
        <a href="/" className="login__voltar">
          ← voltar ao site
        </a>
      </form>
    </main>
  )
}

function Casca({ usuario, aoSair }: { usuario: Usuario; aoSair: () => void }) {
  const [aba, setAba] = useState<Aba>(abaDaUrl)
  const avisar = useAvisar()

  useEffect(() => {
    const ouvir = () => setAba(abaDaUrl())
    window.addEventListener('hashchange', ouvir)
    return () => window.removeEventListener('hashchange', ouvir)
  }, [])

  async function sair() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    avisar('Até logo!')
    aoSair()
  }

  // no celular a navegação rola de lado: traz a aba ativa para a vista
  useEffect(() => {
    document.querySelector('.lateral__link[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [aba])

  const entidade = ENTIDADES.find((e) => e.rota === aba)

  return (
    <div className="casca">
      <aside className="lateral">
        <a className="lateral__marca" href="#projetos">
          <Coracao />
          <span>
            Arte de Amar
            <small>painel</small>
          </span>
        </a>
        <nav className="lateral__nav" aria-label="Seções do painel">
          {ABAS.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="lateral__link" aria-current={aba === a.id ? 'page' : undefined}>
              {a.rotulo}
            </a>
          ))}
        </nav>
        <div className="lateral__rodape">
          <span className="lateral__usuario">{usuario.nome}</span>
          <a href="/" target="_blank" rel="noopener" className="lateral__acao">
            Ver site ↗
          </a>
          <button type="button" className="lateral__acao" onClick={sair}>
            Sair
          </button>
        </div>
      </aside>

      <main className="conteudo">
        {entidade ? (
          <PaginaLista key={entidade.rota} cfg={entidade} />
        ) : aba === 'fotos' ? (
          <PaginaFotos />
        ) : aba === 'voluntarios' ? (
          <PaginaVoluntarios />
        ) : (
          <PaginaConfiguracoes />
        )}
      </main>
    </div>
  )
}

function Painel() {
  const [usuario, setUsuario] = useState<Usuario | null | undefined>(undefined)

  useEffect(() => {
    quandoSessaoExpirar(() => setUsuario(null))
    api<{ usuario: Usuario }>('/auth/eu')
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
  }, [])

  if (usuario === undefined) return <Carregando texto="Abrindo o painel…" />
  if (!usuario) return <Login aoEntrar={setUsuario} />
  return <Casca usuario={usuario} aoSair={() => setUsuario(null)} />
}

createRoot(document.getElementById('painel')!).render(
  <StrictMode>
    <ProvedorAvisos>
      <Painel />
    </ProvedorAvisos>
  </StrictMode>,
)
