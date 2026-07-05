export type CheckoutLine = { variantId: string; quantity: number }

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function createCheckout(lines: CheckoutLine[]): Promise<CheckoutResult> {
  const cartLines = lines
    .filter((l) => l.variantId && l.quantity > 0)
    .map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity }))

  if (cartLines.length === 0) {
    return { ok: false, error: 'Your bag is empty.' }
  }

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: cartLines }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Could not start checkout.' }
    }
    return { ok: true, url: data.url }
  } catch (err) {
    console.warn('[checkout] error:', err)
    return { ok: false, error: 'Something went wrong starting checkout.' }
  }
}
