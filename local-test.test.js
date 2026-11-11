import { describe, expect, it } from 'vitest'
import { isLocalTestEnabled } from '../local-test.js'

describe('ativação do teste local', () => {
  it('permite apenas modo explícito de teste no servidor de desenvolvimento', () => {
    expect(isLocalTestEnabled({ dev: true, mode: 'teste-local', hostname: 'localhost' })).toBe(true)
    expect(isLocalTestEnabled({ dev: true, mode: 'teste-local', hostname: '127.0.0.1' })).toBe(true)
  })
  it('não ativa no desenvolvimento normal', () => {
    expect(isLocalTestEnabled({ dev: true, mode: 'development', hostname: 'localhost' })).toBe(false)
  })
  it('não ativa em build de produção mesmo com o nome do modo de teste', () => {
    expect(isLocalTestEnabled({ dev: false, mode: 'teste-local', hostname: 'localhost' })).toBe(false)
  })
  it('não ativa por um endereço externo', () => {
    expect(isLocalTestEnabled({ dev: true, mode: 'teste-local', hostname: 'avaliacoes.example.com' })).toBe(false)
  })
})
