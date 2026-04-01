import { useEffect } from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { AuthProvider, AuthContext } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { TransactionsPage } from '@/pages/TransactionsPage/TransactionsPage'
import { LoginPage } from '@/pages/LoginPage/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage/ForgotPasswordPage'
import { useContext } from 'react'

function Router() {
  const auth = useContext(AuthContext)!

  // Escuchar el evento que dispara el interceptor de axios al recibir 401
  useEffect(() => {
    function handleLogout() {
      auth.logout()
    }
    window.addEventListener('tenpay:logout', handleLogout)
    return () => window.removeEventListener('tenpay:logout', handleLogout)
  }, [auth])

  if (auth.currentPage === 'login')           return <LoginPage />
  if (auth.currentPage === 'register')        return <RegisterPage />
  if (auth.currentPage === 'forgot-password') return <ForgotPasswordPage />

  // transactions: envuelto en QueryProvider para que React Query funcione
  return (
    <QueryProvider>
      <TransactionsPage />
    </QueryProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
