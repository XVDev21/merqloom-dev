import styles from "./store.module.css"

export default function StoreState({ title, message, href, label }: {
  title: string; message: string; href: string; label: string
}) {
  return <div className={styles.message}>
    <h1>{title}</h1>
    <p>{message}</p>
    {/* Full navigation gives recovery a fresh request, including a retry of the exact URL. */}
    <a href={href}>{label}</a>
  </div>
}
