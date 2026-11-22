import Image from "next/image"
import styles from "./store.module.css"

const trayNatural = { file: "tray-natural", alt: "Illustration of a pale birch desk tray with a shallow raised rim" }
const trayWalnut = { file: "tray-walnut", alt: "Illustration of a dark Walnut-finish desk tray with a shallow raised rim" }
const pouch = { file: "pouch-natural", alt: "Illustration of a natural canvas organizer pouch with a zip closure" }

const catalogMedia = new Map([
  ["desk-tray", trayNatural],
  ["organizer-pouch", pouch],
])
const variantMedia = new Map([
  ["MQ-DIRECT-TRAY", trayNatural],
  ["MQ-DIRECT-TRAY-WALNUT", trayWalnut],
  ["MQ-SUPPLIER-POUCH", pouch],
])

export default function ProductImage({ handle, sku, detail = false }: {
  handle: string; sku?: string | null; detail?: boolean
}) {
  const media = detail ? variantMedia.get(sku ?? "") : catalogMedia.get(handle)
  if (!media) return <div className={styles.imagePlaceholder}>No product illustration</div>

  return <Image
    className={styles.image}
    src={`/catalog/${media.file}.webp`}
    alt={media.alt}
    width={960}
    height={720}
    sizes="(max-width: 650px) 95vw, (max-width: 1200px) 47vw, 620px"
    loading={detail ? "eager" : "lazy"}
  />
}
