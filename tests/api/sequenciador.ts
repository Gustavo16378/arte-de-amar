import { BaseSequencer, type TestSpecification } from 'vitest/node'

/**
 * Os testes de API dividem um banco só e contam uma história em ordem
 * (01-contrato … 09-seguranca): roda pelo nome do arquivo, não pela
 * duração da última rodada, que é o padrão do Vitest.
 */
export default class PorNome extends BaseSequencer {
  async sort(arquivos: TestSpecification[]) {
    return [...arquivos].sort((a, b) => a.moduleId.localeCompare(b.moduleId))
  }
}
