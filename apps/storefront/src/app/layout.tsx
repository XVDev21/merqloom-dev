import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Merqloom Studio",
  description: "Independent commerce demonstration with fictional products.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
