'use client'

import { useState, type FormEvent } from 'react'
import PendingButton from '../pending-button'
import styles from '../store.module.css'
import { checkoutFields, checkoutInput, fieldLabels, invalidFields, type CheckoutField, type CheckoutInput } from './validation'

export default function CheckoutForm({ initialInvalid, initialValues }: { initialInvalid: CheckoutField[]; initialValues: Partial<CheckoutInput> }) {
  const [invalid, setInvalid] = useState(initialInvalid)
  function validate(event: FormEvent<HTMLFormElement>) {
    const errors = invalidFields(checkoutInput(new FormData(event.currentTarget)))
    if (errors.length) {
      event.preventDefault()
      setInvalid(errors)
      document.getElementById(errors[0])?.focus()
    }
  }
  return <>
    {invalid.length > 0 && <p className={styles.error} role="alert">Please correct the marked fields.</p>}
    <form className={styles.checkoutForm} action="/store/checkout/action" method="post" noValidate onSubmit={validate}>
      <h2>Fictional contact and address</h2><input type="hidden" name="action" value="prepare" />
      {checkoutFields.map(name => {
        const [label, message] = fieldLabels[name]
        return <div className={styles.field} key={name}>
          <label htmlFor={name}>{label}</label>
          <input id={name} name={name} type={name === 'email' ? 'email' : 'text'} autoComplete="off" maxLength={120} defaultValue={initialValues[name] ?? ''} aria-invalid={invalid.includes(name) || undefined} aria-describedby={invalid.includes(name) ? `${name}-error` : undefined} autoFocus={name === initialInvalid[0]} onChange={() => setInvalid(current => current.filter(field => field !== name))} required />
          {invalid.includes(name) && <p id={`${name}-error`} className={styles.fieldError}>{message}</p>}
        </div>
      })}
      <p>Country: Philippines</p><p>Payment and shipping are simulated. Review the total before placing the demo order.</p>
      <PendingButton pending="Preparing…">Review simulated order</PendingButton>
    </form>
  </>
}
