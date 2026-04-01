import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { forgotPassword, resetPassword } from '@/api/auth.api'
import { Input } from '@/components/ui/Input/Input'
import { Button } from '@/components/ui/Button/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle'
import styles from './ForgotPasswordPage.module.css'

type Step = 'request' | 'reset' | 'done'

export function ForgotPasswordPage() {
  const { navigateTo } = useAuth()
  const [step, setStep]               = useState<Step>('request')
  const [email, setEmail]             = useState('')
  const [token, setToken]             = useState('')
  const [isDevToken, setIsDevToken]   = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await forgotPassword(email)

      if (result.devToken) {
        // Modo desarrollo: backend devolvió el token directamente.
        // Pre-llenamos el campo y avisamos al usuario.
        setToken(result.devToken)
        setIsDevToken(true)
      }

      setStep('reset')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      setStep('done')
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

        {step === 'request' && (
          <>
            <h1 className={styles.title}>Recuperar contraseña</h1>
            <p className={styles.subtitle}>
              Ingresa tu email y te enviaremos las instrucciones.
            </p>

            {error && <div className={styles.errorAlert} role="alert">{error}</div>}

            <form onSubmit={handleForgot} className={styles.form} noValidate>
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
              <Button type="submit" variant="primary" loading={loading} className={styles.submitBtn}>
                Enviar instrucciones
              </Button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h1 className={styles.title}>Nueva contraseña</h1>
            <p className={styles.subtitle}>
              {isDevToken
                ? 'Token generado (modo desarrollo). Ya está pre-llenado.'
                : 'Ingresa el token recibido por email y tu nueva contraseña.'}
            </p>

            {isDevToken && (
              <div className={styles.devNotice} role="note">
                <strong>Modo desarrollo:</strong> el token fue generado localmente
                porque no hay SMTP configurado. En producción llegaría por email.
              </div>
            )}

            {error && <div className={styles.errorAlert} role="alert">{error}</div>}

            <form onSubmit={handleReset} className={styles.form} noValidate>
              <Input
                id="token"
                label="Token de recuperación"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega el token aquí"
                required
                readOnly={isDevToken}
              />
              <Input
                id="newPassword"
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoFocus
              />
              <Button type="submit" variant="primary" loading={loading} className={styles.submitBtn}>
                Cambiar contraseña
              </Button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div className={styles.success}>
            <p className={styles.successIcon}>✓</p>
            <h1 className={styles.title}>Contraseña actualizada</h1>
            <p className={styles.subtitle}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
          </div>
        )}

        <p className={styles.footer}>
          <button type="button" className={styles.link} onClick={() => navigateTo('login')}>
            ← Volver al inicio de sesión
          </button>
        </p>
      </div>
    </div>
  )
}
