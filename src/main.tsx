import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { carregarConteudo } from './lib/conteudo-remoto'

// a ordem importa: base do Tailwind primeiro, depois as nossas camadas
import './styles/global.css'
import './styles/componentes.css'
import './styles/header.css'
import './styles/preloader.css'
import './styles/secoes.css'
import './styles/visibilidade.css'

/*
 * O conteúdo editável chega da API antes do primeiro render (no máximo
 * 2,5 s). Sem resposta, o site sobe com o conteúdo do código.
 * Ver lib/conteudo-remoto.ts.
 */
carregarConteudo().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
