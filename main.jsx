import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.jsx'
import './styles.css'
import { localTestMode } from './local-test.js'

const { VITE_AUTH0_DOMAIN: domain, VITE_AUTH0_CLIENT_ID: clientId, VITE_AUTH0_AUDIENCE: audience } = import.meta.env

createRoot(document.getElementById('root')).render(
  localTestMode ? <App /> : domain && clientId && audience ? (
    <Auth0Provider domain={domain} clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience, scope: 'openid profile email' }}
      cacheLocation="memory">
      <App />
    </Auth0Provider>
  ) : (
    <main className="configuration"><div className="brand-mark">A</div><h1>Estamos preparando o Avalia.</h1>
      <p>A configuração de acesso ainda precisa ser concluída. Entre em contato com o administrador.</p></main>
  ),
)
