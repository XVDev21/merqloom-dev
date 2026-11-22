import Link from "next/link"
import styles from "./store.module.css"

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.store}>
    <a className={styles.skip} href="#store-content">Skip to content</a>
    <header className={styles.header}>
      <Link className={styles.brand} href="/store">Merqloom <span>Store</span></Link>
      <nav aria-label="Store">
        <Link href="/">Merqloom Studio</Link>
      </nav>
    </header>
    <main id="store-content" tabIndex={-1}>{children}</main>
    <footer className={styles.footer}>
      <p>Fictional products in development. Shipping is simulated.</p>
      <Link href="/roadmap">Development roadmap</Link>
    </footer>
  </div>
}
