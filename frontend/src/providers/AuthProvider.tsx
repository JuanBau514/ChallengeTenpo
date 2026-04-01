import { createContext, useState } from 'react'
import type { ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from '@/api/auth.api'
import type { LoginPayload, RegisterPayload } from '@/api/auth.api'

// TRADE-OFF DOCUMENTADO:
// El JWT se guarda en localStorage. Es más simple que httpOnly cookie pero
// es vulnerable a XSS. Para este challenge es aceptable. En producción real
// usar httpOnly cookie + CSRF token.
const TOKEN_KEY = 'tenpay_token'
const USER_KEY  = 'tenpay_user'

export type Page = 'login' | 'register' | 'forgot-password' | 'transactions'

interface AuthUser {
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  currentPage: Page
  navigateTo: (page: Page) => void
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthUser } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)
  const [currentPage, setCurrentPage] = useState<Page>(
    getStoredToken() ? 'transactions' : 'login'
  )

  function persist(t: string, u: AuthUser) {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  function clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  async function login(payload: LoginPayload) {
    const result = await apiLogin(payload)
    persist(result.token, { name: result.name, email: result.email })
    setCurrentPage('transactions')
  }

  async function register(payload: RegisterPayload) {
    const result = await apiRegister(payload)
    persist(result.token, { name: result.name, email: result.email })
    setCurrentPage('transactions')
  }

  function logout() {
    clear()
    setCurrentPage('login')
  }

  function navigateTo(page: Page) {
    setCurrentPage(page)
  }

  return (
    <AuthContext.Provider value={{ user, token, currentPage, navigateTo, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
