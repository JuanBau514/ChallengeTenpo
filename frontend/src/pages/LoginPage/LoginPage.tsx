import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input/Input'
import { Button } from '@/components/ui/Button/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { login, navigateTo } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.themeBtn}>
        <ThemeToggle />
      </div>

      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>T</span>
          <span className={styles.brandName}>Tenpay</span>
        </div>

        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>

        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <button
            type="button"
            className={styles.forgotLink}
            onClick={() => navigateTo('forgot-password')}
          >
            ¿Olvidaste tu contraseña?
          </button>

          <Button type="submit" variant="primary" loading={loading} className={styles.submitBtn}>
            Iniciar sesión
          </Button>
        </form>

        <p className={styles.footer}>
          ¿No tienes cuenta?{' '}
          <button type="button" className={styles.link} onClick={() => navigateTo('register')}>
            Regístrate
          </button>
        </p>
      </div>
    </div>
  )
}
