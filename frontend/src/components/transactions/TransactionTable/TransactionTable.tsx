import type { Transaction } from '@/types/transaction'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDate'
import styles from './TransactionTable.module.css'

interface Props {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: Props) {
  return (
    <div className={styles.wrapper} role="region" aria-label="Listado de transacciones">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.th}>#</th>
            <th scope="col" className={styles.th}>Usuario</th>
            <th scope="col" className={styles.th}>Comercio</th>
            <th scope="col" className={styles.th}>Monto</th>
            <th scope="col" className={styles.th} aria-sort="descending">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className={styles.row}>
              <td className={styles.td}>
                <span className={styles.idBadge}>
                  {transaction.id}
                  <span className={styles.currency}>{transaction.currency}</span>
                </span>
              </td>
              <td className={styles.td}>{transaction.tenpistName}</td>
              <td className={styles.td}>
                <span className={styles.commerce}>{transaction.merchant}</span>
              </td>
              <td className={styles.td}>
                <span className={styles.amount}>
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </td>
              <td className={styles.td}>
                <time dateTime={transaction.transactionDate}>
                  {formatDateTime(transaction.transactionDate)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
