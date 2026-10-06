// Central fetch wrapper for all authenticated API calls
// Automatically retries with a refreshed access token on 401
// If the refresh also fails, clears tokens and redirects to login

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const getToken = () => localStorage.getItem('accessToken')
const getRefreshToken = () => localStorage.getItem('refreshToken')

export const logout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  window.location.href = '/login'
}

const tryRefresh = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (!res.ok) return false

  const data = await res.json()
  localStorage.setItem('accessToken', data.accessToken)
  return true
}

// Drop-in replacement for fetch() for authenticated requests
// Automatically adds the Authorization header and handles token refresh
export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const makeRequest = () => fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${getToken()}`
    }
  })

  let res = await makeRequest()

  // On 401, try refreshing the token once and retry
  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      res = await makeRequest()
    } else {
      logout()
    }
  }

  return res
}