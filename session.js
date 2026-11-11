import { useAuth0 } from '@auth0/auth0-react'
import { localTestMode } from './local-test.js'

const localSession = {
  isLoading: false,
  isAuthenticated: true,
  isLocalTest: true,
  user: { name: 'Teste local' },
  // O backend local não exige token; nenhum JWT fictício é criado ou enviado.
  getAccessTokenSilently: async () => '',
}

export function useAppSession() {
  const auth0 = useAuth0()
  return localTestMode ? localSession : { ...auth0, isLocalTest: false }
}
