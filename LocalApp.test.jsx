import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'

vi.mock('../local-test.js', () => ({ localTestMode: true }))
// O SDK real fica sem Provider neste teste; o perfil local não chama seus métodos.
const record = { id: 1, aluno: 'Teste local do aluno', professor: 'Ana', materia: 'Software', data: '2026-11-11', nota: 8.5 }
function response(body, status = 200) { return { ok: status < 400, status, json: async () => body } }

beforeEach(() => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([record]))) })

describe('interface local sem Auth0', () => {
  it('abre o cadastro e consulta a API sem token e sem login', async () => {
    render(<App />)
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.getByText(/Teste local sem login/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nova avaliação/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Entrar na plataforma/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sair da conta/ })).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/avaliacoes', expect.objectContaining({ headers: {} }))
  })

  it('envia o cadastro à API sem Authorization e exibe o registro retornado', async () => {
    fetch.mockResolvedValueOnce(response([])).mockResolvedValueOnce(response(record, 201))
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Nova avaliação/ }))
    for (const [name, value] of [['Aluno', 'Teste local do aluno'], ['Professor', 'Ana'], ['Matéria', 'Software'], ['Data da avaliação', '2026-11-11'], ['Nota', '8.5']]) {
      fireEvent.change(screen.getByLabelText(new RegExp(`^${name}`)), { target: { value } })
    }
    fireEvent.click(screen.getByRole('button', { name: /Salvar avaliação/ }))
    expect(await screen.findByText('Avaliação cadastrada com sucesso.')).toBeInTheDocument()
    expect(screen.getByText('Teste local do aluno')).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith('/api/avaliacoes', expect.objectContaining({
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    }))
    expect(JSON.parse(fetch.mock.calls.at(-1)[1].body).nota).toBe(8.5)
  })

  it('explica o ajuste se o backend ainda estiver exigindo autenticação', async () => {
    fetch.mockResolvedValue(response({}, 401))
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('inicie o backend com spring.profiles.active=local')
  })
})
