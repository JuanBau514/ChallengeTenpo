import { apiClient } from './client'
import { ENDPOINTS } from './endpoints'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthResult {
  token: string
  name: string
  email: string
}

export interface ForgotPasswordResult {
  message: string
  devToken?: string   // solo presente cuando MAIL_ENABLED=false en el backend
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>(ENDPOINTS.AUTH.LOGIN, payload)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>(ENDPOINTS.AUTH.REGISTER, payload)
  return data
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const { data } = await apiClient.post<ForgotPasswordResult>(
    ENDPOINTS.AUTH.FORGOT_PASSWORD,
    { email }
  )
  return data
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword })
}
