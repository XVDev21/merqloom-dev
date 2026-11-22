import Image from "next/image"
import styles from "./store.module.css"

const trayNatural = { file: "tray-natural", alt: "Illustration of a pale birch desk tray with a shallow raised rim" }
const trayWalnut = { file: "tray-walnut", alt: "Illustration of a dark Walnut-finish desk tray with a shallow raised rim" }
const pouch = { file: "pouch-natural", alt: "Illustration of a natural canvas organizer pouch with a zip closure" }

export default function ProductImage({ handle, sku, detail = false }: {
  handle: string; sku?: string | null; detail?: boolean
}) {
  const media = handle === "desk-tray" ? (sku === "MQ-DIRECT-TRAY-WALNUT" ? trayWalnut : trayNatural)
    : handle === "organizer-pouch" ? pouch : null
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
