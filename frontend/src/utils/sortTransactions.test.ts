import { describe, it, expect } from 'vitest'
import { sortByDateDesc } from './sortTransactions'
import type { Transaction } from '@/types/transaction'

const transactions: Transaction[] = [
  { id: 'a1b2c3d4-0001-0000-0000-000000000000', amount: 5000, merchant: 'Supermercado', tenpistName: 'Ana', transactionDate: '2024-01-15T10:00:00', currency: 'CLP' },
  { id: 'a1b2c3d4-0002-0000-0000-000000000000', amount: 2000, merchant: 'Farmacia', tenpistName: 'Luis', transactionDate: '2024-03-20T08:30:00', currency: 'USD' },
  { id: 'a1b2c3d4-0003-0000-0000-000000000000', amount: 8500, merchant: 'Tecnología', tenpistName: 'María', transactionDate: '2024-02-10T14:00:00', currency: 'EUR' },
]

describe('sortByDateDesc', () => {
  it('sorts transactions from newest to oldest', () => {
    const sorted = sortByDateDesc(transactions)
    expect(sorted[0].id).toBe(2)
    expect(sorted[1].id).toBe(3)
    expect(sorted[2].id).toBe(1)
  })

  it('does not mutate the original array', () => {
    const original = [...transactions]
    sortByDateDesc(transactions)
    expect(transactions).toEqual(original)
  })

  it('returns empty array when given empty array', () => {
    expect(sortByDateDesc([])).toEqual([])
  })
})
