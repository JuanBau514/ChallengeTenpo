import { useCallback, useState } from 'react'
import type { TransactionFilters } from '@/types/transaction'

const DEFAULT_FILTERS: TransactionFilters = {
  tenpistName: '',
  merchant: '',
  dateFrom: '',
  dateTo: '',
  currency: '',
}

export function useTransactionFilters() {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const setFilter = useCallback(
    <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    []
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  return { filters, setFilter, resetFilters, page, setPage }
}
