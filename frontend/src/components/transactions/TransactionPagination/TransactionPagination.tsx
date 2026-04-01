import { Button } from '@/components/ui/Button/Button'
import styles from './TransactionPagination.module.css'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function TransactionPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav className={styles.nav} aria-label="Paginación de transacciones">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        ← Anterior
      </Button>

      <div className={styles.pages}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Ir a página ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
      >
        Siguiente →
      </Button>
    </nav>
  )
}
