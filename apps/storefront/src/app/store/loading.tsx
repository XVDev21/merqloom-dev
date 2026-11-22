import styles from "./store.module.css"

export default function Loading() {
  return <div className={styles.message} role="status" aria-busy="true">
    <h1>Loading the Store</h1>
    <p>Reading the latest demo catalog from Medusa.</p>
  </div>
}
