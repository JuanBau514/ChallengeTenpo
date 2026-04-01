import styles from './Spinner.module.css'

interface Props {
  label?: string
}

export function Spinner({ label = 'Cargando...' }: Props) {
  return (
    <div className={styles.container} role="status" aria-label={label}>
      <div className={styles.spinner} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </div>
  )
}
