export const SUPPORTED_CURRENCIES = ['CLP', 'COP', 'USD', 'EUR'] as const

export type Currency = typeof SUPPORTED_CURRENCIES[number]

export const CURRENCY_LABELS: Record<Currency, string> = {
  CLP: 'CLP — Peso chileno',
  COP: 'COP — Peso colombiano',
  USD: 'USD — Dólar',
  EUR: 'EUR — Euro',
}

export interface Transaction {
  id: string        // UUID serializado como string desde el backend
  amount: number
  merchant: string
  tenpistName: string
  transactionDate: string
  currency: Currency
}

export interface CreateTransactionPayload {
  amount: number
  merchant: string
  transactionDate: string
  currency: Currency
}

export interface TransactionFilters {
  tenpistName: string
  merchant: string
  dateFrom: string
  dateTo: string
  currency: string
}
