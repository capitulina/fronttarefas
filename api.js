const API_URL = '/tarefas'

export async function fetchTarefas(
  token,
  { method = 'GET', body, signal } = {}
) {
  const headers = {}

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(API_URL, {
    method,
    headers,
    signal,
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)

    const error = new Error(
      payload?.message ||
      `Erro ao acessar tarefas: ${response.status}`
    )

    error.fields = payload?.fields || {}
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}