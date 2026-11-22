"use client"

import { useLinkStatus } from "next/link"

export default function VariantPending() {
  const { pending } = useLinkStatus()
  return <span className="sr-only" aria-live="polite">{pending ? "Loading finish" : ""}</span>
}
