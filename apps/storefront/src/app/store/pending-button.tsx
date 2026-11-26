'use client'

import { useEffect, useRef, useState } from 'react'

export default function PendingButton({ children, pending = 'Please wait…' }: { children: React.ReactNode; pending?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const button = ref.current
    const form = button?.form
    if (!button || !form) return
    const onSubmit = (event: SubmitEvent) => {
      if (event.submitter && event.submitter !== button) return
      // React's delegated validation runs later in the same submit event.
      window.setTimeout(() => { if (!event.defaultPrevented) setBusy(true) }, 0)
    }
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) setBusy(false) }
    form.addEventListener('submit', onSubmit)
    window.addEventListener('pageshow', onPageShow)
    return () => { form.removeEventListener('submit', onSubmit); window.removeEventListener('pageshow', onPageShow) }
  }, [])
  return <button ref={ref} type="submit" disabled={busy} aria-disabled={busy}><span aria-live="polite">{busy ? pending : children}</span></button>
}
