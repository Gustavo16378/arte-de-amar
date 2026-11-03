/**
 * Contratos da API (RNF11): o formato que o site e o painel esperam de cada
 * resposta. Os testes de API validam as respostas reais contra estes
 * schemas; se alguém mudar a API sem mudar o front, o teste quebra antes da
 * produção.
 */
import { z } from 'zod'

export const Erro = z.object({ erro: z.string().min(1) }).strict()

export const Foto = z.object({
  src: z.string().regex(/^\/(assets\/fotos\/[\w-]+\.(jpg|webp|png)|api\/midias\/\d+)$/),
  alt: z.string(),
  largura: z.number().int().positive(),
  altura: z.number().int().positive(),
  posicao: z.string().regex(/^\d{1,3}% \d{1,3}%$/).optional(),
})

export const ProjetoPublico = z.object({
  nome: z.string().min(1),
  objetivo: z.string(),
  objetivoCurto: z.string(),
  publico: z.string(),
  status: z.enum(['Em andamento', 'Concluído']),
  foto: Foto,
  meta: z.tuple([z.number().int(), z.number().int().positive(), z.string()]).nullable(),
  depoimento: z.string(),
  autor: z.string(),
  videoUrl: z.string().url().startsWith('https://').nullable(),
})

export const MarcoPublico = z.object({
  ano: z.string().min(1),
  titulo: z.string(),
  texto: z.string(),
  textoDesktop: z.string(),
  foto: Foto,
  soDesktop: z.boolean(),
})

export const MembroPublico = z.object({ nome: z.string(), cargo: z.string(), foto: Foto.nullable() })
export const NumeroPublico = z.object({ valor: z.number().int().nonnegative(), sufixo: z.string(), label: z.string() })

export const ConteudoPublico = z
  .object({
    projetos: z.array(ProjetoPublico),
    marcos: z.array(MarcoPublico),
    membros: z.array(MembroPublico),
    numeros: z.array(NumeroPublico),
    config: z.object({ whatsapp: z.string().regex(/^\d{12,13}$/), pix: z.string().min(5) }),
    textos: z.record(z.string(), z.union([z.string(), Foto])),
  })
  .strict()

const base = { id: z.number().int().positive(), ordem: z.number().int(), visivel: z.union([z.literal(0), z.literal(1)]), versao: z.number().int().nonnegative(), atualizado_em: z.string() }

export const ProjetoAdmin = z.object({
  ...base,
  nome: z.string(),
  status: z.enum(['Em andamento', 'Concluído']),
  foto_id: z.number().int(),
  foto_url: z.string().optional(),
  meta_feito: z.number().int().nullable(),
  meta_total: z.number().int().nullable(),
  meta_unidade: z.string().nullable(),
  video_url: z.string().nullable(),
})

export const Midia = z.object({
  id: z.number().int().positive(),
  url: z.string(),
  alt: z.string(),
  largura: z.number().int().positive(),
  altura: z.number().int().positive(),
  bytes: z.number().int().nonnegative(),
  estatica: z.boolean(),
  usos: z.number().int().nonnegative(),
  criado_em: z.string(),
})

export const Voluntario = z.object({
  id: z.number().int(),
  nome: z.string(),
  whatsapp: z.string().regex(/^\d{10,13}$/),
  como: z.string(),
  status: z.enum(['novo', 'contatado', 'arquivado']),
  criado_em: z.string(),
})

export const Usuario = z
  .object({ id: z.number().int(), nome: z.string(), email: z.string().email(), trocarSenha: z.boolean().optional() })
  .strict()

export const PessoaDoPainel = z.object({
  id: z.number().int(),
  nome: z.string(),
  email: z.string(),
  trocar_senha: z.union([z.literal(0), z.literal(1)]),
  criado_em: z.string(),
  ultimo_acesso: z.string().nullable(),
})

export const RegistroAuditoria = z.object({
  id: z.number().int(),
  usuario_id: z.number().int().nullable(),
  usuario_nome: z.string(),
  acao: z.enum(['criou', 'editou', 'apagou', 'reordenou', 'entrou', 'enviou', 'trocou']),
  area: z.string(),
  alvo: z.string(),
  detalhe: z.string(),
  criado_em: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
})

export const Espaco = z.object({
  usado: z.number().nonnegative(),
  limite: z.literal(500_000_000),
  porcentagem: z.number().min(0).max(100),
  bytesFotos: z.number().nonnegative(),
  fotosEnviadas: z.number().int().nonnegative(),
  voluntarios: z.number().int().nonnegative(),
})
