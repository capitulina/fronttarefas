import { localTestMode } from './local-test.js'

const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function fetchAvaliacoes(token, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${apiBase}/avaliacoes`, {
    method, signal,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const localHelp = localTestMode && [401, 403].includes(response.status)
      ? 'Para este teste sem login, inicie o backend com spring.profiles.active=local.' : ''
    const error = new Error(localHelp || data.message || (response.status === 401 ? 'Sua sessão expirou. Saia e entre novamente.' :
      response.status === 403 ? 'Seu perfil não tem permissão para esta ação.' : 'Não foi possível acessar as avaliações. Tente novamente.'))
    error.fields = data.errors || {}
    error.status = response.status
    throw error
  }
  return data
}
