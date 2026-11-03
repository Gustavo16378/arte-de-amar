/**
 * Global setup do Vitest para os testes de API: um servidor e um banco
 * novos para a rodada inteira. O endereço e a pasta do banco chegam aos
 * testes por `inject`.
 */
import type { TestProject } from 'vitest/node'
// @ts-expect-error módulo .mjs sem tipos
import { subir } from '../servidor-teste.mjs'

declare module 'vitest' {
  export interface ProvidedContext {
    url: string
    estado: string
  }
}

export default async function (projeto: TestProject) {
  const s = await subir(8798)
  projeto.provide('url', s.url)
  projeto.provide('estado', s.estado)
  return () => s.parar()
}
