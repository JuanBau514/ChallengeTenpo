import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input/Input'
import { Button } from '@/components/ui/Button/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle'
import styles from './RegisterPage.module.css'

export function RegisterPage() {
  const { register, navigateTo } = useAuth()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ name, email, password })
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

        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Completa los datos para registrarte</p>

        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            id="name"
            label="Nombre completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Pérez"
            required
            autoComplete="name"
          />
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
            placeholder="Mínimo 8 caracteres"
            required
            autoComplete="new-password"
          />

          <Button type="submit" variant="primary" loading={loading} className={styles.submitBtn}>
            Crear cuenta
          </Button>
        </form>

        <p className={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <button type="button" className={styles.link} onClick={() => navigateTo('login')}>
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  )
}
