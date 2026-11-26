export const checkoutFields = ['email', 'first_name', 'last_name', 'address_1', 'city', 'postal_code'] as const
export type CheckoutField = typeof checkoutFields[number]
export type CheckoutInput = Record<CheckoutField, string>
export const fieldLabels: Record<CheckoutField, [string, string]> = {
  email: ['Email', 'Enter a valid email address.'],
  first_name: ['First name', 'Enter a first name.'],
  last_name: ['Last name', 'Enter a last name.'],
  address_1: ['Street address', 'Enter a street address.'],
  city: ['City or municipality', 'Enter a city or municipality.'],
  postal_code: ['Philippine postal code', 'Enter a four-digit postal code.'],
}
export function checkoutInput(form: FormData): CheckoutInput {
  return Object.fromEntries(checkoutFields.map(field => [field, String(form.get(field) ?? '').trim()])) as CheckoutInput
}
export function invalidFields(input: CheckoutInput): CheckoutField[] {
  return checkoutFields.filter(field => !input[field] || input[field].length > 120 ||
    (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) ||
    (field === 'postal_code' && !/^\d{4}$/.test(input.postal_code)))
}
