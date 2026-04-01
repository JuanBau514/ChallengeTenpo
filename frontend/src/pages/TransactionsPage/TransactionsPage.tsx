import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTransactions } from '@/hooks/useTransactions'
import { useCreateTransaction } from '@/hooks/useCreateTransaction'
import { useTransactionFilters } from '@/hooks/useTransactionFilters'
import { TransactionTable } from '@/components/transactions/TransactionTable/TransactionTable'
import { TransactionForm } from '@/components/transactions/TransactionForm/TransactionForm'
import { TransactionFilters } from '@/components/transactions/TransactionFilters/TransactionFilters'
import { TransactionPagination } from '@/components/transactions/TransactionPagination/TransactionPagination'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { Button } from '@/components/ui/Button/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import type { CreateTransactionInput } from '@/schemas/transaction.schema'
import styles from './TransactionsPage.module.css'

const PAGE_SIZE = 10

export function TransactionsPage() {
  const { user, logout } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { filters, setFilter, resetFilters, page, setPage } = useTransactionFilters()
  const { data: allTransactions, isLoading, isError, error } = useTransactions(filters)
  const { mutate: createTransaction, isPending, error: mutationError } = useCreateTransaction()

  const totalPages = allTransactions ? Math.ceil(allTransactions.length / PAGE_SIZE) : 0
  const paginatedTransactions = allTransactions
    ? allTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : []

  function handleSubmit(data: CreateTransactionInput) {
    createTransaction(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Transacciones</h1>
          {user && <p className={styles.userGreeting}>Hola, {user.name}</p>}
          <p className={styles.subtitle}>
            {allTransactions ? (
              <>
                <span aria-live="polite">{allTransactions.length}</span> transacción
                {allTransactions.length !== 1 ? 'es' : ''} encontrada
                {allTransactions.length !== 1 ? 's' : ''}
              </>
            ) : null}
          </p>
        </div>

        <div className={styles.headerActions}>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
          <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
          <Dialog.Trigger asChild>
            <Button variant="primary">+ Nueva transacción</Button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.modal} aria-describedby="form-desc">
              <Dialog.Title className={styles.modalTitle}>
                Registrar transacción
              </Dialog.Title>
              <p id="form-desc" className={styles.modalDesc}>
                Completa los campos para registrar una nueva transacción.
              </p>

              {mutationError && (
                <div className={styles.mutationError} role="alert">
                  {mutationError.message}
                </div>
              )}

              <TransactionForm
                onSubmit={handleSubmit}
                isLoading={isPending}
                onCancel={() => setIsFormOpen(false)}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        </div>
      </header>

      <TransactionFilters
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
      />

      <main className={styles.content}>
        {isLoading && <Spinner />}

        {isError && (
          <div className={styles.errorState} role="alert">
            <p className={styles.errorTitle}>No se pudieron cargar las transacciones</p>
            <p className={styles.errorMessage}>{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !isError && paginatedTransactions.length === 0 && (
          <EmptyState
            title={
              Object.values(filters).some(Boolean)
                ? 'Sin resultados'
                : 'Sin transacciones'
            }
            description={
              Object.values(filters).some(Boolean)
                ? 'Ninguna transacción coincide con los filtros aplicados.'
                : 'No hay transacciones registradas. ¡Crea la primera!'
            }
          />
        )}

        {!isLoading && !isError && paginatedTransactions.length > 0 && (
          <>
            <TransactionTable transactions={paginatedTransactions} />
            <TransactionPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </main>
    </div>
  )
}
