import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Interceptor de REQUEST: añadir JWT si existe en localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tenpay_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de RESPONSE: normalizar errores + limpiar sesión en 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido: limpiar localStorage.
      // AuthProvider detectará el estado vacío y mostrará la pantalla de login.
      localStorage.removeItem('tenpay_token')
      localStorage.removeItem('tenpay_user')
      window.dispatchEvent(new Event('tenpay:logout'))
    }

    const message =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'Error desconocido'
    return Promise.reject(new Error(message))
  }
)
