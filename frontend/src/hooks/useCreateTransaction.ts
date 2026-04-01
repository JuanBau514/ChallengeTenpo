import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionKeys } from '@/constants/queryKeys'
import { createTransaction } from '@/api/transactions/transactions.api'

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}
