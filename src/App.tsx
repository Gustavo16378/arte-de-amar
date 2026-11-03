import { useEffect, useState } from 'react'
import { DefinicoesSvg } from './components/Fio'
import { Header } from './components/Header'
import { Preloader, preloaderVaiRodar } from './components/Preloader'
import { iniciarLenis } from './lib/lenis'
import { Hero } from './components/sections/Hero'
import { Numeros } from './components/sections/Numeros'
import { QuemSomos } from './components/sections/QuemSomos'
import { Historia } from './components/sections/Historia'
import { Diretoria } from './components/sections/Diretoria'
import { Atuacao } from './components/sections/Atuacao'
import { Projetos } from './components/sections/Projetos'
import { ComoAjudar } from './components/sections/ComoAjudar'
import { Footer } from './components/sections/Footer'
import { MARCOS } from './content/marcos'
import { MEMBROS } from './content/membros'
import { PROJETOS } from './content/projetos'
import { NUMEROS } from './content/site'

/**
 * A página inteira: preloader, navegação, o fio e o motion de cada seção.
 *
 * A ordem é a do design: hero, números, quem somos, história, diretoria,
 * atuação, projetos, como ajudar, rodapé.
 */
export default function App() {
  /*
   * O hero só anima depois que a cortina sobe. Sem preloader, ele já pode
   * começar no primeiro quadro.
   */
  const [heroLiberado, setHeroLiberado] = useState(() => !preloaderVaiRodar())

  useEffect(() => {
    iniciarLenis()
  }, [])

  return (
    <div className="pagina">
      <DefinicoesSvg />
      <Preloader aoTerminar={() => setHeroLiberado(true)} />
      <Header />

      <main>
        <Hero liberado={heroLiberado} />
        {/* seção que a diretoria esvaziou no painel (tudo oculto) sai da página */}
        {NUMEROS.length > 0 && <Numeros />}
        <QuemSomos />
        {MARCOS.length > 0 && <Historia />}
        {MEMBROS.length > 0 && <Diretoria />}
        <Atuacao />
        {PROJETOS.length > 0 && <Projetos />}
        <ComoAjudar />
      </main>

      <Footer />
    </div>
  )
}
