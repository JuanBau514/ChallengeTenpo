import type { TransactionFilters } from '@/types/transaction'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.all, 'list', filters] as const,
}
