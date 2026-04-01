import { z } from 'zod'
import { SUPPORTED_CURRENCIES } from '@/types/transaction'

export const createTransactionSchema = z.object({
  amount: z
    .number()
    .int('El monto debe ser un número entero')
    .positive('El monto debe ser mayor a 0'),
  merchant: z
    .string()
    .trim()
    .min(1, 'El giro o comercio es obligatorio')
    .max(255, 'El comercio no puede superar 255 caracteres'),
  // tenpistName es auto-poblado por el backend desde el usuario autenticado.
  // Se mantiene en el schema como opcional para no romper el tipo inferido.
  tenpistName: z.string().trim().max(255).optional(),
  transactionDate: z
    .string()
    .min(1, 'La fecha es obligatoria')
    .refine((val) => {
      const inputDate = new Date(val)
      return !isNaN(inputDate.getTime())
    }, 'La fecha no es válida')
    .refine((val) => {
      const inputDate = new Date(val)
      const now = new Date()
      return inputDate <= now
    }, 'La fecha no puede ser futura'),
  currency: z.enum(SUPPORTED_CURRENCIES, {
    error: () => ({ message: 'Selecciona una moneda válida' }),
  }),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
