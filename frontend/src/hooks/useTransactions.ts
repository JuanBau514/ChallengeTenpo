import { useQuery } from '@tanstack/react-query'
import { transactionKeys } from '@/constants/queryKeys'
import { getTransactions } from '@/api/transactions/transactions.api'
import { sortByDateDesc } from '@/utils/sortTransactions'
import type { Transaction, TransactionFilters } from '@/types/transaction'

function applyFilters(data: Transaction[], filters: TransactionFilters): Transaction[] {
  return data.filter((t) => {
    const matchesTenpistName =
      !filters.tenpistName ||
      t.tenpistName.toLowerCase().includes(filters.tenpistName.toLowerCase())

    const matchesMerchant =
      !filters.merchant ||
      t.merchant.toLowerCase().includes(filters.merchant.toLowerCase())

    const matchesDateFrom =
      !filters.dateFrom || new Date(t.transactionDate) >= new Date(filters.dateFrom)

    const matchesDateTo =
      !filters.dateTo || new Date(t.transactionDate) <= new Date(filters.dateTo)

    const matchesCurrency =
      !filters.currency || t.currency === filters.currency

    return matchesTenpistName && matchesMerchant && matchesDateFrom && matchesDateTo && matchesCurrency
  })
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: getTransactions,
    select: (data) => sortByDateDesc(applyFilters(data, filters)),
    staleTime: 30_000,
  })
}
