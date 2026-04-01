import type { Transaction } from '@/types/transaction'

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  )
}
