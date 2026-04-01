import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDateTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    return format(date, "dd/MM/yyyy HH:mm", { locale: es })
  } catch {
    return dateStr
  }
}

export function formatDateForInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}
