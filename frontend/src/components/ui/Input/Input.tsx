import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
}

export function Input({ label, error, id, className, ...rest }: Props) {
  const errorId = `${id}-error`

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {rest.required && <span className={styles.required} aria-hidden="true"> *</span>}
      </label>
      <input
        {...rest}
        id={id}
        className={clsx(styles.input, error && styles.invalid, className)}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
