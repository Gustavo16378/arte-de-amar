/**
 * Páginas do painel que não são lista: voluntários e configurações.
 */
import { useEffect, useState } from 'react'
import { api, type Voluntario } from './api'
import { BotaoPerigoso, Carregando, useAvisar } from './ui'

const ROTULO_STATUS: Record<Voluntario['status'], string> = {
  novo: 'Novo',
  contatado: 'Já chamado',
  arquivado: 'Arquivado',
}

function formatarTelefone(n: string) {
  const local = n.startsWith('55') && n.length > 11 ? n.slice(2) : n
  return local.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')
}

function formatarData(iso: string) {
  // o D1 grava em UTC sem fuso: "2026-11-03 16:53:22"
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function PaginaVoluntarios() {
  const [itens, setItens] = useState<Voluntario[] | null>(null)
  const [filtro, setFiltro] = useState<'ativos' | 'arquivado'>('ativos')
  const avisar = useAvisar()

  useEffect(() => {
    api<{ itens: Voluntario[] }>('/admin/voluntarios')
      .then((r) => setItens(r.itens))
      .catch((e) => avisar(e.message, 'erro'))
  }, [avisar])

  async function mudarStatus(v: Voluntario, status: Voluntario['status']) {
    setItens((l) => l?.map((i) => (i.id === v.id ? { ...i, status } : i)) ?? null)
    try {
      await api(`/admin/voluntarios/${v.id}`, { method: 'PUT', json: { status } })
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  async function apagar(v: Voluntario) {
    try {
      await api(`/admin/voluntarios/${v.id}`, { method: 'DELETE' })
      setItens((l) => l?.filter((i) => i.id !== v.id) ?? null)
      avisar('Contato apagado.')
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  const visiveis = itens?.filter((v) => (filtro === 'ativos' ? v.status !== 'arquivado' : v.status === 'arquivado'))
  const novos = itens?.filter((v) => v.status === 'novo').length ?? 0

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Voluntários</h2>
          <p className="pagina__descricao">
            Quem preencheu “Ser voluntário” no site. Toque em WhatsApp para chamar a pessoa, já com uma mensagem pronta.
          </p>
        </div>
        <div className="segmentos" role="radiogroup" aria-label="Filtrar">
          <button type="button" role="radio" aria-checked={filtro === 'ativos'} className="segmentos__item" onClick={() => setFiltro('ativos')}>
            Ativos{novos ? ` · ${novos} novo${novos > 1 ? 's' : ''}` : ''}
          </button>
          <button type="button" role="radio" aria-checked={filtro === 'arquivado'} className="segmentos__item" onClick={() => setFiltro('arquivado')}>
            Arquivados
          </button>
        </div>
      </header>

      {!visiveis ? (
        <Carregando />
      ) : visiveis.length === 0 ? (
        <p className="vazio">
          {filtro === 'ativos' ? 'Nenhum contato novo. Quando alguém se inscrever no site, aparece aqui.' : 'Nada arquivado.'}
        </p>
      ) : (
        <ul className="voluntarios">
          {visiveis.map((v) => {
            const primeiroNome = v.nome.split(' ')[0]
            const mensagem = `Oi, ${primeiroNome}! Aqui é da Arte de Amar. Vimos que você quer ser voluntário, que alegria! Podemos conversar sobre a próxima ação?`
            const numero = v.whatsapp.startsWith('55') ? v.whatsapp : `55${v.whatsapp}`
            return (
              <li key={v.id} className={`voluntario voluntario--${v.status}`}>
                <div className="voluntario__topo">
                  <strong>{v.nome}</strong>
                  <span className="etiqueta">{ROTULO_STATUS[v.status]}</span>
                </div>
                <p className="voluntario__como">{v.como || 'Não disse como quer ajudar.'}</p>
                <p className="voluntario__meta">
                  {formatarTelefone(v.whatsapp)} · {formatarData(v.criado_em)}
                </p>
                <div className="voluntario__acoes">
                  <a
                    className="btn btn--primario"
                    href={`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => v.status === 'novo' && mudarStatus(v, 'contatado')}
                  >
                    WhatsApp
                  </a>
                  {v.status !== 'arquivado' ? (
                    <button type="button" className="btn btn--fantasma" onClick={() => mudarStatus(v, 'arquivado')}>
                      Arquivar
                    </button>
                  ) : (
                    <button type="button" className="btn btn--fantasma" onClick={() => mudarStatus(v, 'contatado')}>
                      Desarquivar
                    </button>
                  )}
                  <BotaoPerigoso confirmar="Apagar mesmo?" aoConfirmar={() => apagar(v)}>
                    Apagar
                  </BotaoPerigoso>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function PaginaConfiguracoes() {
  const [config, setConfig] = useState<{ whatsapp: string; pix: string } | null>(null)
  const [senha, setSenha] = useState({ atual: '', nova: '', repetir: '' })
  const [salvando, setSalvando] = useState(false)
  const avisar = useAvisar()

  useEffect(() => {
    api<{ config: { whatsapp?: string; pix?: string } }>('/admin/configuracoes')
      .then(({ config: c }) => setConfig({ whatsapp: formatarTelefone(c.whatsapp ?? ''), pix: c.pix ?? '' }))
      .catch((e) => avisar(e.message, 'erro'))
  }, [avisar])

  async function salvarContatos(e: React.FormEvent) {
    e.preventDefault()
    if (!config) return
    setSalvando(true)
    try {
      await api('/admin/configuracoes', { method: 'PUT', json: config })
      avisar('Contatos salvos. O site já usa os novos.')
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha.nova !== senha.repetir) return avisar('As duas senhas novas não são iguais.', 'erro')
    try {
      await api('/admin/senha', { method: 'PUT', json: { atual: senha.atual, nova: senha.nova } })
      setSenha({ atual: '', nova: '', repetir: '' })
      avisar('Senha trocada.')
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Configurações</h2>
          <p className="pagina__descricao">Contatos que aparecem no site e a sua senha do painel.</p>
        </div>
      </header>

      {!config ? (
        <Carregando />
      ) : (
        <form className="cartao" onSubmit={salvarContatos}>
          <h3 className="cartao__titulo">Contatos do site</h3>
          <label className="campo">
            <span className="campo__rotulo">WhatsApp da ONG</span>
            <input
              inputMode="tel"
              value={config.whatsapp}
              onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
              placeholder="(63) 99999-9999"
            />
            <span className="campo__dica">Usado nos botões “Falar no WhatsApp” do site.</span>
          </label>
          <label className="campo">
            <span className="campo__rotulo">Chave PIX</span>
            <input value={config.pix} onChange={(e) => setConfig({ ...config, pix: e.target.value })} />
            <span className="campo__dica">Aparece em “Como ajudar”, com o botão de copiar.</span>
          </label>
          <div className="envio__acoes">
            <button type="submit" className="btn btn--primario" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar contatos'}
            </button>
          </div>
        </form>
      )}

      <form className="cartao" onSubmit={trocarSenha}>
        <h3 className="cartao__titulo">Trocar senha</h3>
        <label className="campo">
          <span className="campo__rotulo">Senha atual</span>
          <input type="password" autoComplete="current-password" value={senha.atual} onChange={(e) => setSenha({ ...senha, atual: e.target.value })} />
        </label>
        <div className="grupo--lado grupo__campos">
          <label className="campo">
            <span className="campo__rotulo">Nova senha</span>
            <input type="password" autoComplete="new-password" minLength={10} value={senha.nova} onChange={(e) => setSenha({ ...senha, nova: e.target.value })} />
            <span className="campo__dica">Pelo menos 10 caracteres.</span>
          </label>
          <label className="campo">
            <span className="campo__rotulo">Repita a nova senha</span>
            <input type="password" autoComplete="new-password" value={senha.repetir} onChange={(e) => setSenha({ ...senha, repetir: e.target.value })} />
          </label>
        </div>
        <div className="envio__acoes">
          <button type="submit" className="btn btn--secundario" disabled={!senha.atual || senha.nova.length < 10}>
            Trocar senha
          </button>
        </div>
      </form>
    </section>
  )
}
