import type { Metadata } from "next"
import Link from "next/link"
import styles from "../studio.module.css"

export const metadata: Metadata = {
  title: "Development roadmap | Merqloom Studio",
  description: "See what you can explore today and what Merqloom plans to demonstrate next.",
}

const stages = [
  ["Foundation", "Available in the demo", "Browse the seeded catalog. The local foundation also includes authenticated native Medusa Admin, sample inventory, and isolated services."],
  ["Shopping experience", "Catalog available", "Browse collections, search the catalog, and compare finishes. The next work verifies a server-backed cart, clear totals, and simulated checkout."],
  ["Connected operations", "Planned", "Verify a direct-stock order and manual fulfillment in Admin first. A later milestone will exercise fictional supplier imports, stock freshness, mock fulfillment, and retry visibility."],
  ["Demonstration release", "Targeted", "Replay both test-order paths, review accessibility, and document a repeatable walkthrough. Each milestone requires verification and review."],
]

export default function Roadmap() {
  return <div className={styles.studio}>
    <header className={`${styles.wrap} ${styles.header}`}>
      <span className={styles.brand}>Merqloom <span>Studio</span></span>
      <nav aria-label="Studio"><Link href="/">Back to Studio</Link></nav>
    </header>
    <main className={`${styles.wrap} ${styles.section} ${styles.roadmap}`}>
      <h1>Development roadmap</h1>
      <p className={styles.lead}>Merqloom is in development. The target for the MVP demonstration is <time dateTime="2026-12-07">December 7, 2026</time>.</p>
      <p>Production availability and real integrations depend on separate validation and approval.</p>
      <ol className={styles.milestones}>
        {stages.map(([title, status, description]) => <li key={title}>
          <h2>{title}</h2>
          <div><strong>{status}</strong><p>{description}</p></div>
        </li>)}
      </ol>
      <Link className={styles.button} href="/store">Explore the demo catalog</Link>
    </main>
  </div>
}
