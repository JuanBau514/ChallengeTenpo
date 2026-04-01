import type { TransactionFilters } from '@/types/transaction'
import { SUPPORTED_CURRENCIES, CURRENCY_LABELS } from '@/types/transaction'
import { Button } from '@/components/ui/Button/Button'
import styles from './TransactionFilters.module.css'

interface Props {
  filters: TransactionFilters
  onFilterChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void
  onReset: () => void
}

export function TransactionFilters({ filters, onFilterChange, onReset }: Props) {
  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className={styles.container}>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="filter-tenpistName" className={styles.label}>Usuario</label>
          <input
            id="filter-tenpistName"
            type="text"
            className={styles.input}
            placeholder="Filtrar por usuario..."
            value={filters.tenpistName}
            onChange={(e) => onFilterChange('tenpistName', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-merchant" className={styles.label}>Comercio</label>
          <input
            id="filter-merchant"
            type="text"
            className={styles.input}
            placeholder="Filtrar por comercio..."
            value={filters.merchant}
            onChange={(e) => onFilterChange('merchant', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-date-from" className={styles.label}>Desde</label>
          <input
            id="filter-date-from"
            type="date"
            className={styles.input}
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-date-to" className={styles.label}>Hasta</label>
          <input
            id="filter-date-to"
            type="date"
            className={styles.input}
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-currency" className={styles.label}>Moneda</label>
          <select
            id="filter-currency"
            className={styles.input}
            value={filters.currency}
            onChange={(e) => onFilterChange('currency', e.target.value)}
          >
            <option value="">Todas las monedas</option>
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>
                {CURRENCY_LABELS[curr]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
