/**
 * Textos institucionais, números e contatos.
 * Fonte: o design aprovado, nas versões desktop e mobile.
 */

import { FOTOS } from './fotos'

export const SITE = {
  nome: 'Arte de Amar',
  nomeCompleto: 'OSC Arte de Amar',
  cidade: 'Palmas',
  estado: 'Tocantins',
  local: 'Palmas, Tocantins',
  desde: 2015,
  cnpj: '40.019.106/0001-51',
  instagram: '@ongartedeamar',
  instagramUrl: 'https://instagram.com/ongartedeamar',
  // TODO número real da ONG, confirmar com a diretoria
  whatsappNumero: '5563999999999',
  whatsapp: 'https://wa.me/5563999999999',
  titulo: 'Arte de Amar · ONG em Palmas, Tocantins',
  descricao:
    'Organização da sociedade civil de Palmas, Tocantins. Desde 2015 acompanhamos crianças e famílias em vulnerabilidade com campanhas, voluntários e parceiros.',
  // domínio do Cloudflare Pages; trocar se a ONG registrar um próprio
  url: 'https://arte-de-amar-site.pages.dev/',
} as const

export const NAV = [
  { id: 'inicio', label: 'Início' },
  { id: 'quem-somos', label: 'Quem somos' },
  { id: 'historia', label: 'Nossa história' },
  { id: 'diretoria', label: 'Diretoria' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'como-ajudar', label: 'Como ajudar' },
] as const

export const HERO = {
  // o | marca a palavra em Sentient itálico
  titulo: ['A arte de |amar|', 'é feita de pessoas.'],
  subtitulo:
    'Desde 2015 espalhando amor e construindo um mundo melhor em Palmas, Tocantins.',
  ctaPrimario: 'Quero ajudar',
  ctaSecundario: 'Conhecer a ONG',
  role: 'role',
} as const

/**
 * Números de impacto.
 * TODO confirmar com a ONG: os quatro valores são estimativas do design.
 */
export const NUMEROS = [
  { valor: 11, sufixo: '', label: 'anos de atuação', velocidade: 0.04, alinhamento: 'start' },
  { valor: 3197, sufixo: '+', label: 'crianças atendidas', velocidade: 0.06, alinhamento: 'end' },
  { valor: 40, sufixo: '+', label: 'campanhas realizadas', velocidade: 0.05, alinhamento: 'start' },
  { valor: 120, sufixo: '+', label: 'voluntários ativos', velocidade: 0.07, alinhamento: 'center' },
] as const

export const QUEM_SOMOS = {
  rotulo: 'Quem somos',
  titulo: 'Gente que se junta e vira |coração|.',
  // versão curta, do mobile, que é a versão principal
  paragrafoMobile:
    'Somos uma organização de Palmas que, desde 2015, acompanha crianças e famílias em vulnerabilidade. Campanhas, voluntários e parceiros, sempre de perto.',
  // versão longa, do desktop
  paragrafoDesktop:
    'A Arte de Amar é uma organização da sociedade civil de Palmas, Tocantins, que desde 2015 acompanha crianças e famílias em situação de vulnerabilidade. Nascemos de um grupo de amigos que decidiu que amar precisava virar ação: campanhas de Volta às Aulas, Natal Solidário, Dia das Crianças, Ação de Páscoa e o McDia Feliz ao lado do Hospital de Amor. Trabalhamos com voluntários, parceiros e a própria comunidade, sempre de perto, de casa em casa.',
  foto: FOTOS.equipeCirculo,
  legenda: ['Ação de Páscoa,', '2025'],
  pilares: [
    {
      rotulo: 'Missão',
      curto: 'Cuidado concreto a quem mais precisa.',
      longo: 'Levar cuidado concreto a quem mais precisa, com respeito e presença.',
    },
    {
      rotulo: 'Visão',
      curto: 'Nenhuma criança de Palmas sem o básico e o afeto.',
      longo: 'Uma Palmas onde nenhuma criança cresça sem acesso ao básico e ao afeto.',
    },
    {
      rotulo: 'Valores',
      curto: 'Amor em ação, transparência, comunidade, alegria.',
      longo: 'Amor em ação, transparência, comunidade e alegria.',
    },
  ],
} as const

export const HISTORIA = {
  rotulo: 'Nossa história',
  titulo: 'Onze anos costurados a |muitas mãos|.',
  // mobile: uma frase em Sentient itálico
  frase: '"Arte" porque amar bem exige ofício. "De Amar" porque, no fim, é só isso.',
  // desktop: bloco "A origem do nome"
  origemRotulo: 'A origem do nome',
  origem:
    '"Arte" porque amar bem exige ofício: paciência, repetição, cuidado no detalhe. "De Amar" porque é só isso, no fim. O nome nasceu numa conversa de cozinha, em 2015, e nunca mais saiu.',
} as const

export const ATUACAO = {
  rotulo: 'Onde a gente chega',
  tituloDesktop: 'Onde a gente |chega|.',
  // mobile: três frases grandes, uma palavra em itálico menta cada
  frases: [
    'Assistência social, educação, saúde e |cultura|.',
    'Crianças de 0 a 14 anos e as suas |famílias|.',
    'Sem sede fixa, com voluntários e |parceiros| da cidade.',
  ],
  // desktop: as mesmas três ideias em colunas
  colunas: [
    {
      rotulo: 'Áreas de atuação',
      texto:
        'Assistência social, educação, saúde e cultura. Cestas, material escolar, roupas, brinquedos, encaminhamentos e, sempre, um dia de festa.',
    },
    {
      rotulo: 'Público atendido',
      texto:
        'Crianças de 0 a 14 anos e suas famílias nas comunidades de Palmas e região, com prioridade para quem está fora da rede de proteção.',
    },
    {
      rotulo: 'Como trabalhamos',
      texto:
        'Sem sede fixa, com voluntários e parceiros locais. Cada campanha tem meta, prestação de contas aberta e entrega feita em mãos.',
    },
  ],
} as const

export const DIRETORIA = {
  rotulo: 'Diretoria',
  titulo: 'As pessoas por trás do |coração|.',
  dica: 'arraste →',
} as const

export const PROJETOS_SECAO = {
  rotulo: 'Projetos e campanhas',
  titulo: 'Nossos |projetos|',
  filtros: ['Todos', 'Em andamento', 'Concluídos'],
} as const

export const AJUDAR = {
  rotulo: 'Como ajudar',
  titulo: 'Faça parte dessa |corrente do bem|.',
  doar: {
    rotulo: 'Doar',
    texto:
      'Cada real vira mochila, cesta, brinquedo e transporte para as ações. Prestação de contas publicada a cada campanha.',
    pixRotulo: 'Chave PIX · CNPJ',
    botao: 'Copiar chave PIX',
    botaoCopiado: 'Copiada',
    qrLegenda: 'Cada real vira mochila, cesta e transporte. Contas abertas a cada campanha.',
    qrLegendaDesktop: 'aponte a câmera do seu banco',
    // TODO payload PIX estático (BR Code) do CNPJ, para gerar o QR de verdade
    payloadPix: null,
  },
  voluntario: {
    rotulo: 'Ser voluntário',
    // o {nome} e o {texto} são trocados pelo que a pessoa escreveu
    mensagem:
      'Olá, quero ser voluntário da Arte de Amar. Meu nome é {nome}. Gostaria de ajudar com: {texto}',
    texto: 'Deixe seu contato. A gente chama no WhatsApp para a próxima ação.',
    campos: [
      { nome: 'nome', label: 'Seu nome', tipo: 'text' },
      { nome: 'whatsapp', label: 'WhatsApp', tipo: 'tel' },
      { nome: 'como', label: 'Como você gostaria de ajudar?', tipo: 'textarea' },
    ],
    botao: 'Quero ser voluntário',
    sucesso: 'Recebemos! Em breve a gente te chama.',
  },
  parceiro: {
    rotulo: 'Ser parceiro',
    botaoInstagram: 'Ver no Instagram',
    textoMobile:
      'Sua empresa pode apadrinhar uma campanha inteira, como McDonald’s, Hospital de Amor e Palmas Para a Vida já fazem.',
    textoDesktop:
      'Empresas que caminham com a gente: McDonald’s, Hospital de Amor, Casa Ronald McDonald e Palmas Para a Vida. Sua marca pode apadrinhar uma campanha inteira, doar produtos ou abrir espaço para a arrecadação.',
    botao: 'Falar no WhatsApp',
  },
} as const

export const FOOTER = {
  frase: 'Desde 2015 espalhando |muito amor|.',
  foto: FOTOS.equipeMural,
  credito: 'site feito à mão por · nome do estúdio',
} as const

export const FOTO_HERO = FOTOS.heroMenino
