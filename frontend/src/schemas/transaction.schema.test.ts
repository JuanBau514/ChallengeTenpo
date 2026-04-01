import { describe, it, expect } from 'vitest'
import { createTransactionSchema } from './transaction.schema'

const validPayload = {
  amount: 5000,
  merchant: 'Supermercado Lider',
  tenpistName: 'Juan Pérez',
  transactionDate: '2024-01-15T10:00:00',
  currency: 'CLP',
}

describe('createTransactionSchema', () => {
  it('passes with valid data', () => {
    const result = createTransactionSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('fails when amount is 0', () => {
    const result = createTransactionSchema.safeParse({ ...validPayload, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('fails when amount is negative', () => {
    const result = createTransactionSchema.safeParse({ ...validPayload, amount: -100 })
    expect(result.success).toBe(false)
  })

  it('fails when merchant is empty', () => {
    const result = createTransactionSchema.safeParse({ ...validPayload, merchant: '' })
    expect(result.success).toBe(false)
  })

  it('fails when tenpistName is empty', () => {
    const result = createTransactionSchema.safeParse({ ...validPayload, tenpistName: '' })
    expect(result.success).toBe(false)
  })

  it('fails when transactionDate is in the future', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const result = createTransactionSchema.safeParse({
      ...validPayload,
      transactionDate: futureDate.toISOString(),
    })
    expect(result.success).toBe(false)
  })

  it('fails when amount is a float', () => {
    const result = createTransactionSchema.safeParse({ ...validPayload, amount: 50.5 })
    expect(result.success).toBe(false)
  })
})
