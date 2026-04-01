import styles from './EmptyState.module.css'

interface Props {
  title?: string
  description?: string
}

export function EmptyState({
  title = 'Sin transacciones',
  description = 'No hay transacciones registradas. ¡Crea la primera!',
}: Props) {
  return (
    <div className={styles.container} role="status">
      <div className={styles.icon} aria-hidden="true">📋</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
