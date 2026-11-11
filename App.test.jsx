import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { getRoles } from '../auth.js'

const auth = vi.hoisted(() => ({ current: {} }))
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => auth.current }))
const claim = 'https://social-insper.com/roles'
function token(roles) { return `header.${btoa(JSON.stringify({ [claim]: roles }))}.signature` }
function response(body, status = 200) { return { ok: status < 400, status, json: async () => body } }
const record = { id: 1, aluno: 'Renan', professor: 'Ana Silva', materia: 'Software', data: '2026-11-09', nota: 8.5 }

beforeEach(() => {
  auth.current = { isAuthenticated: true, isLoading: false, user: { name: 'Renan' },
    getAccessTokenSilently: vi.fn().mockResolvedValue(token(['USER'])), logout: vi.fn(), loginWithRedirect: vi.fn().mockResolvedValue(undefined) }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([record])))
})

describe('Avalia', () => {
  it('offers Auth0 login before accessing the API', () => {
    auth.current.isAuthenticated = false
    render(<App/>); fireEvent.click(screen.getByRole('button', { name: /Entrar na plataforma/i }))
    expect(auth.current.loginWithRedirect).toHaveBeenCalledOnce()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('lists records for USER and hides the creation form', async () => {
    render(<App/>)
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('09/11/2026')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nova avaliação/i })).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/avaliacoes', expect.objectContaining({ headers: { Authorization: `Bearer ${token(['USER'])}` } }))
  })

  it('filters the list and allows clearing filters', async () => {
    render(<App/>); await screen.findByText('Ana Silva')
    fireEvent.change(screen.getByRole('textbox', { name: /Buscar avaliações/i }), { target: { value: 'Não existe' } })
    expect(screen.getByText('Nenhuma avaliação encontrada')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Limpar filtros/i }))
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  })

  it('lets ADMIN create and displays the persisted response', async () => {
    auth.current.getAccessTokenSilently.mockResolvedValue(token(['ADMIN']))
    fetch.mockResolvedValueOnce(response([])).mockResolvedValueOnce(response(record, 201))
    render(<App/>); fireEvent.click(await screen.findByRole('button', { name: /Nova avaliação/i }))
    for (const [name, value] of [['Aluno', 'Renan'], ['Professor', 'Ana Silva'], ['Matéria', 'Software'], ['Data da avaliação', '2026-11-09'], ['Nota', '8.5']]) {
      fireEvent.change(screen.getByLabelText(new RegExp(`^${name}`)), { target: { value } })
    }
    fireEvent.click(screen.getByRole('button', { name: /Salvar avaliação/i }))
    expect(await screen.findByText('Avaliação cadastrada com sucesso.')).toBeInTheDocument()
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith('/api/avaliacoes', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(fetch.mock.calls.at(-1)[1].body)).toEqual({ aluno: 'Renan', professor: 'Ana Silva', materia: 'Software', data: '2026-11-09', nota: 8.5 })
  })

  it('shows a permission error without showing a false empty state', async () => {
    fetch.mockResolvedValue(response({ message: 'Acesso negado.' }, 403))
    render(<App/>)
    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso negado.')
    expect(screen.queryByText('O próximo aprendizado começa aqui')).not.toBeInTheDocument()
  })

  it('keeps the form and shows backend field validation on failure', async () => {
    auth.current.getAccessTokenSilently.mockResolvedValue(token(['ADMIN']))
    fetch.mockResolvedValueOnce(response([])).mockResolvedValueOnce(response({ message: 'Confira os campos.', errors: { professor: 'Informe o professor.' } }, 400))
    render(<App/>); fireEvent.click(await screen.findByRole('button', { name: /Nova avaliação/i }))
    fireEvent.submit(screen.getByRole('button', { name: /Salvar avaliação/i }).closest('form'))
    expect(await screen.findByText('Informe o professor.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Professor/)).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(screen.getByRole('button', { name: /Salvar avaliação/i })).toBeEnabled())
  })

  it('does not infer ADMIN from a malformed or unrelated claim', () => {
    expect(getRoles('broken')).toEqual([])
    expect(getRoles(token('ADMIN'))).toEqual([])
    expect(getRoles(token(['USER']))).toEqual(['USER'])
  })
})
