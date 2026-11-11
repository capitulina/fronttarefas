export function isLocalTestEnabled({ dev, mode, hostname }) {
  return dev === true && mode === 'teste-local' &&
    ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)
}

// Este modo só existe no servidor de desenvolvimento, acessado pelo próprio computador.
export const localTestMode = isLocalTestEnabled({
  dev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  hostname: window.location.hostname,
})
