import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Transaction, CreateTransactionPayload } from '@/types/transaction'

export async function getTransactions(): Promise<Transaction[]> {
  const { data } = await apiClient.get<Transaction[]>(ENDPOINTS.TRANSACTIONS)
  return data
}

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>(ENDPOINTS.TRANSACTIONS, payload)
  return data
}
