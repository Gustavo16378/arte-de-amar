import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMotionProximo } from '../../hooks/useMotionProximo'
import { gsap } from '../../lib/gsap'
import { revelar, revelarLinhas, semMovimento } from '../../lib/motion'
import { Botao } from '../Botao'
import { IconeInstagram } from '../IconeInstagram'
import { CoracaoDoFio } from '../CoracaoDoFio'
import { Fio } from '../Fio'
import { comEnfase } from '../Titulo'
import { AJUDAR, SITE } from '../../content/site'
import { enviarVoluntario } from '../../lib/conteudo-remoto'
import { pixDaOng } from '../../lib/pix'
import { QrPix } from '../QrPix'

/**
 * Como ajudar. O fio chega ao centro, curva e termina na fenda superior do
 * coração, que se fecha atrás do título.
 *
 * Três blocos: PIX, formulário de voluntário e contato de parceiro. No mobile
 * eles se empilham separados por linhas finas; no desktop viram três colunas.
 *
 * Motion: o título entra por linha, os blocos em stagger, e o coração do
 * botão do PIX preenche e pulsa uma vez quando a chave é copiada.
 */
export function ComoAjudar() {
  const [copiada, setCopiada] = useState(false)
  const [codigoCopiado, setCodigoCopiado] = useState(false)
  // o mesmo texto vira o QR e o "copia e cola"
  const payloadPix = pixDaOng(SITE.pix)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const timer = useRef<number>()
  const secao = useRef<HTMLElement>(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useMotionProximo(secao, () => {
    const el = secao.current
    if (!el) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cortes: ReturnType<typeof revelarLinhas>[] = []
      let vivo = true

      document.fonts?.ready.then(() => {
        if (!vivo) return
        const titulo = el.querySelector('.ajudar__titulo')
        if (titulo) cortes.push(revelarLinhas(titulo, { intervalo: 0.1 }))
      })

      revelar(el.querySelector('.rotulo'), { y: 16 })
      revelar(el.querySelectorAll('.ajudar__bloco'), {
        y: 20,
        intervalo: 0.12,
        gatilho: el.querySelector('.ajudar__blocos'),
      })

      return () => {
        vivo = false
        for (const c of cortes) c.revert()
      }
    })

    return () => mm.revert()
  })

  /*
   * O contato vai para o banco e aparece no painel da diretoria. Se a API
   * estiver fora do ar, o envio cai no plano antigo: abre o WhatsApp da ONG
   * com a mensagem já escrita, para ninguém perder o voluntário.
   */
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return
    const dados = new FormData(e.currentTarget)
    const nome = String(dados.get('nome') ?? '').trim()
    const whatsapp = String(dados.get('whatsapp') ?? '').trim()
    const texto = String(dados.get('como') ?? '').trim()

    setEnviando(true)
    setErroEnvio(null)
    const falha = await enviarVoluntario({
      nome,
      whatsapp,
      como: texto,
      site: String(dados.get('site') ?? ''),
    })
    setEnviando(false)

    if (falha && falha !== 'offline') {
      setErroEnvio(falha)
      return
    }

    if (falha === 'offline') {
      const mensagem = AJUDAR.voluntario.mensagem
        .replace('{nome}', nome)
        .replace('{texto}', texto || 'o que for preciso')
      window.open(
        `https://wa.me/${SITE.whatsappNumero}?text=${encodeURIComponent(mensagem)}`,
        '_blank',
        'noopener,noreferrer',
      )
    }
    setEnviado(true)
  }

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(SITE.pix)
    } catch {
      /* sem permissão de área de transferência: a chave segue visível na tela */
    }
    setCopiada(true)

    // o coração do botão preenche e pulsa uma vez
    const coracao = secao.current?.querySelector('.ajudar__pix-botao svg')
    if (coracao && !semMovimento()) {
      gsap
        .timeline()
        .fromTo(
          coracao,
          { scale: 1 },
          { scale: 1.35, duration: 0.25, ease: 'power2.out' },
        )
        .to(coracao, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' })
    }

    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopiada(false), 2400)
  }

  return (
    <section
      ref={secao}
      id="como-ajudar"
      className="secao secao-escura ajudar calha"
      data-secao="como-ajudar"
      data-dark=""
    >
      {/* quem desenha este fio é o CoracaoDoFio, em sequência com o coração */}
      <Fio secao="ajudar" cor="menta" externo />
      <CoracaoDoFio />

      <div className="secao__conteudo">
        <span className="rotulo">{AJUDAR.rotulo}</span>
        <h2 className="ajudar__titulo">{comEnfase(AJUDAR.titulo)}</h2>
      </div>

      <div className="ajudar__blocos">
        {/* ---------------------------------------------------------- PIX */}
        <div className="ajudar__bloco ajudar__bloco--doar">
          <span className="rotulo-simples ajudar__doar-rotulo">{AJUDAR.doar.rotulo}</span>
          <p className="ajudar__doar-texto">{AJUDAR.doar.texto}</p>

          <span className="rotulo-simples ajudar__pix-rotulo">
            {AJUDAR.doar.pixRotulo}
          </span>
          <span className="ajudar__pix-chave">{SITE.pix}</span>

          <Botao
            aparencia="menta"
            largo
            comCoracao
            className={`ajudar__pix-botao${copiada ? ' esta-copiada' : ''}`}
            onClick={copiarPix}
          >
            {copiada ? AJUDAR.doar.botaoCopiado : AJUDAR.doar.botao}
          </Botao>
          <span className="sr-only" role="status">
            {copiada ? 'Chave PIX copiada' : ''}
          </span>

          <div className="ajudar__qr">
            <div className="ajudar__qr-quadro">
              <QrPix payload={payloadPix} />
            </div>
            <div className="ajudar__qr-texto">
              <span className="ajudar__qr-legenda so-mobile">{AJUDAR.doar.qrLegenda}</span>
              <span className="ajudar__qr-legenda so-desktop">
                {AJUDAR.doar.qrLegendaDesktop}
              </span>
              {/* no celular não dá para escanear a própria tela: o copia e cola resolve */}
              <button
                type="button"
                className="ajudar__copia-e-cola"
                data-payload={payloadPix}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(payloadPix)
                  } catch {
                    /* sem permissão de área de transferência */
                  }
                  setCodigoCopiado(true)
                }}
              >
                {codigoCopiado ? AJUDAR.doar.copiaEColaCopiado : AJUDAR.doar.copiaECola}
              </button>
              <span className="sr-only" role="status">
                {codigoCopiado ? 'Código Pix copia e cola copiado' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------- VOLUNTÁRIO */}
        <form className="ajudar__bloco ajudar__bloco--voluntario" onSubmit={enviar}>
          <span className="rotulo-simples">{AJUDAR.voluntario.rotulo}</span>
          <p className="ajudar__doar-texto">{AJUDAR.voluntario.texto}</p>

          {enviado ? (
            <p className="ajudar__sucesso">{AJUDAR.voluntario.sucesso}</p>
          ) : (
            <>
              <div className="ajudar__campos">
                {AJUDAR.voluntario.campos.map((c) => (
                  <label key={c.nome} className="ajudar__campo">
                    {c.tipo === 'textarea' ? (
                      <textarea name={c.nome} rows={2} placeholder=" " />
                    ) : (
                      <input name={c.nome} type={c.tipo} placeholder=" " required />
                    )}
                    <span className="ajudar__campo-label">{c.label}</span>
                  </label>
                ))}
              </div>

              {/* invisível para pessoas: só robô preenche, e a API descarta */}
              <input
                name="site"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="ajudar__isca"
              />

              {erroEnvio && (
                <p className="ajudar__erro" role="alert">
                  {erroEnvio}
                </p>
              )}

              <Botao
                aparencia="contorno"
                largo
                type="submit"
                className="ajudar__enviar"
                disabled={enviando}
              >
                {enviando ? 'Enviando…' : AJUDAR.voluntario.botao}
              </Botao>
            </>
          )}
        </form>

        {/* ------------------------------------------------------ PARCEIRO */}
        <div className="ajudar__bloco ajudar__bloco--parceiro">
          <span className="rotulo-simples">{AJUDAR.parceiro.rotulo}</span>
          <p className="ajudar__parceiro-texto so-mobile">
            {AJUDAR.parceiro.textoMobile}
          </p>
          <p className="ajudar__parceiro-texto so-desktop">
            {AJUDAR.parceiro.textoDesktop}
          </p>

          <div className="ajudar__parceiro-botoes">
            <Botao href={SITE.whatsapp} aparencia="creme" comCoracao largo>
              {AJUDAR.parceiro.botao}
            </Botao>
            <Botao href={SITE.instagramUrl} aparencia="contorno-creme" largo>
              <IconeInstagram />
              {AJUDAR.parceiro.botaoInstagram}
            </Botao>
          </div>
        </div>
      </div>
    </section>
  )
}
