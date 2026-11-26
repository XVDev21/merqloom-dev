import type { Metadata } from "next"
import Link from "next/link"
import styles from "./studio.module.css"

export const metadata: Metadata = {
  title: "Merqloom Studio | Storefront & Commerce Operations",
  description: "Explore Merqloom, a commerce platform in development connecting storefronts, inventory, and order workflows. Browse the demo catalog or read the roadmap.",
}

const navigation = [
  ["Platform", "#platform"],
  ["Storefront", "#storefront"],
  ["Operations", "#operations"],
  ["How it works", "#journey"],
  ["FAQs", "#faq"],
]

const questions = [
  ["Is Merqloom available for production use?", "Merqloom is in development. The initial demonstration uses fictional products, sample data, and simulated transactions."],
  ["Does Merqloom support dropshipping?", "A fictional supplier workflow is planned. Live integrations depend on provider specifications, approval, and separate validation."],
  ["Can Merqloom manage my own inventory?", "The foundation includes a seeded merchant stock location. The direct demo will verify order handling and manual fulfillment from that stock."],
  ["Does Merqloom process real payments?", "The demo checkout simulates payments and shipping. Production payments would require an approved provider and separate validation."],
  ["Will it work with different product categories?", "The catalog model supports product variants. The demo uses desk accessories, and other categories may have additional requirements."],
  ["Is it a replacement for Shopify or WooCommerce?", "Merqloom is an independent development project. Its current scope is a bounded commerce demonstration."],
  ["How much will it cost?", "Commercial pricing is undecided. The development roadmap tracks validation of the core workflows."],
  ["Can I request a walkthrough?", "A request channel is pending. The roadmap lists the planned walkthrough and its prerequisites."],
]

export default function Studio() {
  return <div className={styles.studio}>
    <a className={styles.skip} href="#studio-content">Skip to content</a>
    <header className={`${styles.wrap} ${styles.header}`}>
      <span className={styles.brand}>Merqloom <span>Studio</span></span>
      <nav aria-label="Studio">
        {navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        <Link href="/roadmap">Explore the roadmap</Link>
      </nav>
    </header>

    <main id="studio-content" tabIndex={-1}>
      <div className={`${styles.wrap} ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <p className={styles.notice}>Merqloom is an independent commerce platform in development. The demo uses fictional products and simulated payment and shipping. Supplier flows remain planned.</p>
          <h1>Commerce,<br />connected</h1>
          <p className={styles.lead}>Merqloom is being built to connect what shoppers see with the inventory, orders, and fulfillment merchants manage.</p>
          <p>For independent merchants and growing teams, the goal is a better shopping experience and a clearer way to run commerce.</p>
          <div className={styles.actions}>
            <Link className={styles.button} href="/store">Explore the demo catalog</Link>
            <a href="#platform">Explore the platform</a>
          </div>
        </div>

        <figure className={styles.flow}>
          <div className={styles.objects} aria-hidden="true">
            <div className={styles.tray} />
            <div className={styles.pouch} />
          </div>
          <figcaption>Illustrated demo fixtures</figcaption>
          <dl>
            <div><dt>Desk tray</dt><dd>Merchant stock · Direct path</dd></div>
            <div><dt>Organizer pouch</dt><dd>Fictional supplier · Future path</dd></div>
          </dl>
          <a href="#fulfillment">Compare fulfillment paths</a>
        </figure>

        <section id="platform" className={styles.platform}>
          <h2>Behind the storefront</h2>
          <p>When a shopper finds a product, the merchant still has to know whether it is available, where it will ship from, and who will handle the order when stock changes.</p>
          <p>Merqloom’s design connects the public Store with merchant operations in native Medusa Admin. Medusa owns the catalog and inventory records. The planned demo follows an order from a Store product through fulfillment and back to its status in Admin.</p>
        </section>
      </div>

      <div className={styles.dark}>
        <div className={`${styles.wrap} ${styles.pair}`}>
          <section id="storefront">
            <h2>Merqloom Store</h2>
            <p>Browse two fictional desk accessories today. Search the catalog, filter by collection, and see each product’s dimensions, finish, demo price, and stock from Medusa.</p>
            <p>Available tray finishes can be added to a cart. Review native totals and simulated shipping before placing a demo order.</p>
            <Link href="/store">Explore the demo catalog</Link>
          </section>
          <section id="operations">
            <h2>Merchant operations</h2>
            <p>The local foundation uses native Medusa Admin as the authenticated merchant console. The demo is configured with sample products and merchant stock.</p>
            <p>The direct-order milestone will verify order visibility and manual fulfillment. Later supplier work will add mapping, stock freshness, and a way for merchants to investigate failed imports or fulfillment requests.</p>
            <a href="#fulfillment">See the operations workflow</a>
          </section>
        </div>
      </div>

      <section id="fulfillment" className={`${styles.wrap} ${styles.section} ${styles.split}`}>
        <div>
          <h2>Two fulfillment paths</h2>
          <p>Where the stock lives determines who will handle an order. Open either path to see what the current catalog shows and what the demo plans to verify.</p>
        </div>
        <div className={styles.disclosures}>
          <details>
            <summary><span>Direct inventory</span><span>Desk tray</span></summary>
            <p>The sample desk tray uses merchant stock. The direct demo will follow three steps.</p>
            <ol>
              <li>Browse the product and submit a simulated checkout.</li>
              <li>Find the order in Admin and fulfill it from the merchant’s stock location.</li>
              <li>Verify the order status and native stock changes.</li>
            </ol>
          </details>
          <details>
            <summary><span>Fictional supplier</span><span>Organizer pouch</span></summary>
            <p>The organizer pouch is a catalog preview. Supplier ordering and fulfillment are planned.</p>
            <ol>
              <li>Map the product to a fictional supplier and import a dated stock observation.</li>
              <li>Route a simulated order through the mock supplier workflow.</li>
              <li>Review acknowledgments, fulfillment updates, and any failed requests.</li>
            </ol>
          </details>
        </div>
      </section>

      <div className={styles.warm}>
        <section id="journey" className={`${styles.wrap} ${styles.section} ${styles.split}`}>
          <div>
            <h2>The demo journey</h2>
            <p>Today, the public journey reaches simulated checkout and creates a demo order in Medusa. Manual fulfillment and supplier processing remain later milestones.</p>
            <Link href="/store">Start with the demo catalog</Link>
          </div>
          <ol className={styles.steps}>
            <li><strong>Prepare the catalog.</strong> Set up products, variants, and stock in Medusa.</li>
            <li><strong>Publish to the Store.</strong> Visitors browse the two seeded products today.</li>
            <li><strong>Receive a demo order.</strong> Simulated checkout records the order in Medusa.</li>
            <li><strong>Process fulfillment.</strong> The roadmap covers manual fulfillment first and the fictional supplier path after it.</li>
            <li><strong>Review progress.</strong> Planned checks will trace order status, stock changes, and supplier exceptions.</li>
          </ol>
        </section>
      </div>

      <section className={`${styles.wrap} ${styles.section}`} aria-label="Product principles">
        <div className={styles.editorial}>
          <div>
            <h2>Automation with oversight</h2>
            <p>Planned automation will process supplier stock updates, coordinate supported order events, and surface failures for investigation and controlled retries. Supplier acknowledgments and status updates will be simulated.</p>
          </div>
          <div>
            <h2>Clear buying decisions</h2>
            <p>The Store is designed around useful specifications, readable screens, and keyboard navigation. Checkout shows native totals and simulation terms before submission. Measurement remains a plan.</p>
          </div>
          <div>
            <h2>Room to extend</h2>
            <p>Next.js serves the public site, and Medusa owns commerce records. Future extensions could include additional suppliers, reporting, storefront customization, and approved payment or shipping providers.</p>
          </div>
        </div>
      </section>

      <section id="faq" className={`${styles.wrap} ${styles.section} ${styles.split}`}>
        <h2>Common questions</h2>
        <div className={styles.disclosures}>
          {questions.map(([question, answer]) => <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>)}
        </div>
      </section>

      <div className={styles.dark}>
        <section className={`${styles.wrap} ${styles.section} ${styles.split}`}>
          <h2>From catalog to fulfillment</h2>
          <div>
            <p>Follow the foundation, shopping, operations, and demonstration milestones as Merqloom connects the first product view to the final order update. The MVP demonstration target is December 7, 2026.</p>
            <Link href="/roadmap">Explore the roadmap</Link>
          </div>
        </section>
      </div>
    </main>

    <footer className={`${styles.wrap} ${styles.footer}`}>
      <span className={styles.brand}>Merqloom</span>
      <p>An independent development project. Demo products, suppliers, orders, payments, and shipments are fictional.</p>
      <Link href="/roadmap">Development roadmap</Link>
    </footer>
  </div>
}
