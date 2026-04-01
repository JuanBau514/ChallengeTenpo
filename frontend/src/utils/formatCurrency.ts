import type { Currency } from '@/types/transaction'

// Locales por moneda: cada país tiene su convención de separadores.
// CLP y COP usan 'es-CL' / 'es-CO' (punto como separador de miles, sin decimales).
// USD y EUR usan sus convenciones estándar.
const LOCALE_MAP: Record<Currency, string> = {
  CLP: 'es-CL',
  COP: 'es-CO',
  USD: 'en-US',
  EUR: 'de-DE',
}

// Cache de formatters: crear un Intl.NumberFormat es costoso.
// Guardamos uno por moneda y lo reutilizamos.
const formatterCache = new Map<Currency, Intl.NumberFormat>()

function getFormatter(currency: Currency): Intl.NumberFormat {
  if (!formatterCache.has(currency)) {
    formatterCache.set(
      currency,
      new Intl.NumberFormat(LOCALE_MAP[currency], {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    )
  }
  return formatterCache.get(currency)!
}

export function formatCurrency(amount: number, currency: Currency = 'CLP'): string {
  return getFormatter(currency).format(amount)
}
