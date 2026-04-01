import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTransactionSchema, type CreateTransactionInput } from '@/schemas/transaction.schema'
import { SUPPORTED_CURRENCIES, CURRENCY_LABELS } from '@/types/transaction'
import { Input } from '@/components/ui/Input/Input'
import { Button } from '@/components/ui/Button/Button'
import { formatDateForInput } from '@/utils/formatDate'
import styles from './TransactionForm.module.css'

interface Props {
  onSubmit: (data: CreateTransactionInput) => void
  isLoading: boolean
  onCancel: () => void
}

export function TransactionForm({ onSubmit, isLoading, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    mode: 'onChange',
    defaultValues: {
      amount: undefined,
      merchant: '',
      transactionDate: formatDateForInput(new Date()),
      currency: 'CLP',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
      <div className={styles.fields}>
        <Input
          id="amount"
          label="Monto"
          type="number"
          min={1}
          step={1}
          required
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        <div className={styles.selectField}>
          <label htmlFor="currency" className={styles.selectLabel}>
            Moneda <span aria-hidden="true">*</span>
          </label>
          <select
            id="currency"
            className={styles.select}
            aria-invalid={!!errors.currency}
            {...register('currency')}
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_LABELS[code]}
              </option>
            ))}
          </select>
          {errors.currency && (
            <span className={styles.selectError} role="alert">
              {errors.currency.message}
            </span>
          )}
        </div>

        <Input
          id="merchant"
          label="Giro o comercio"
          type="text"
          placeholder="Ej: Supermercado, Farmacia..."
          required
          error={errors.merchant?.message}
          {...register('merchant')}
        />
        <Input
          id="transactionDate"
          label="Fecha de transacción"
          type="datetime-local"
          required
          max={formatDateForInput(new Date())}
          error={errors.transactionDate?.message}
          {...register('transactionDate')}
          className={styles.fullWidth}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={isLoading}>
          Registrar transacción
        </Button>
      </div>
    </form>
  )
}
