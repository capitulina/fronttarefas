export const rolesClaim = import.meta.env.VITE_AUTH0_ROLES_CLAIM || 'https://social-insper.com/roles'

// Decoding is only for showing the appropriate UI. The API verifies the signature and permissions.
export function getRoles(token, claim = rolesClaim) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), c => c.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes))
    return Array.isArray(payload[claim]) ? payload[claim].filter(role => typeof role === 'string') : []
  } catch { return [] }
}
