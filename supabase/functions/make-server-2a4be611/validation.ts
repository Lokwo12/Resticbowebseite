/**
 * validation.ts
 * HTML-escaping and input validation utilities for all public form handlers.
 * Import these and use them BEFORE inserting into KV or composing email HTML.
 */

// ---------------------------------------------------------------------------
// HTML Escaping
// ---------------------------------------------------------------------------

/**
 * Escape a user-supplied string so it is safe to embed inside an HTML email.
 * Never embed raw user input in HTML without calling this first.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Truncate and escape a message body.
 * Preserves line breaks as <br> after escaping.
 */
export function escapeMessage(str: unknown, maxLen = 2000): string {
  const truncated = String(str ?? '').slice(0, maxLen)
  return escapeHtml(truncated).replace(/\n/g, '<br>')
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export interface ValidationResult {
  ok: boolean
  error?: string
}

/** Validate a name: 1–100 printable characters, not just whitespace. */
export function validateName(name: unknown): ValidationResult {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { ok: false, error: 'Name is required' }
  }
  if (name.trim().length > 100) {
    return { ok: false, error: 'Name must be 100 characters or fewer' }
  }
  return { ok: true }
}

/** Validate an email address format. */
export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== 'string' || email.trim().length === 0) {
    return { ok: false, error: 'Email is required' }
  }
  // RFC 5321 practical regex — not exhaustive but catches obvious problems
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!emailRe.test(email.trim())) {
    return { ok: false, error: 'Invalid email address' }
  }
  if (email.length > 254) {
    return { ok: false, error: 'Email address is too long' }
  }
  return { ok: true }
}

/** Validate a phone number: digits, spaces, +, -, () only; 7–20 chars. */
export function validatePhone(phone: unknown): ValidationResult {
  if (phone === undefined || phone === null || phone === '') return { ok: true } // optional
  if (typeof phone !== 'string') return { ok: false, error: 'Invalid phone number' }
  const cleaned = phone.replace(/[\s\-().+]/g, '')
  if (!/^\d{7,20}$/.test(cleaned)) {
    return { ok: false, error: 'Phone number must be 7–20 digits' }
  }
  return { ok: true }
}

/** Validate a free-text message: required, 1–2000 characters. */
export function validateMessage(msg: unknown, maxLen = 2000): ValidationResult {
  if (typeof msg !== 'string' || msg.trim().length === 0) {
    return { ok: false, error: 'Message is required' }
  }
  if (msg.length > maxLen) {
    return { ok: false, error: `Message must be ${maxLen} characters or fewer` }
  }
  return { ok: true }
}

/** Validate a subject/topic: required, 1–200 characters. */
export function validateSubject(subj: unknown, maxLen = 200): ValidationResult {
  if (typeof subj !== 'string' || subj.trim().length === 0) {
    return { ok: false, error: 'Subject is required' }
  }
  if (subj.length > maxLen) {
    return { ok: false, error: `Subject must be ${maxLen} characters or fewer` }
  }
  return { ok: true }
}

/** Validate a donation amount: positive number, reasonable range. */
export function validateAmount(amount: unknown): ValidationResult {
  const n = Number(amount)
  if (isNaN(n) || n <= 0) {
    return { ok: false, error: 'Amount must be a positive number' }
  }
  if (n > 10_000_000) {
    return { ok: false, error: 'Amount exceeds maximum allowed value' }
  }
  return { ok: true }
}

/** Validate a mobile money phone number for Uganda: 10 digits starting with 07x or 256. */
export function validateMobileMoneyPhone(phone: unknown): ValidationResult {
  if (typeof phone !== 'string') return { ok: false, error: 'Phone number is required' }
  const cleaned = phone.replace(/\D/g, '')
  // Accept: 07xxxxxxxx (10 digits) or 2567xxxxxxxx (12 digits)
  if (!/^(07\d{8}|2567\d{8})$/.test(cleaned)) {
    return { ok: false, error: 'Please enter a valid Ugandan mobile number (e.g. 0771234567)' }
  }
  return { ok: true }
}

/** Normalise a Ugandan mobile number to the international format (2567xxxxxxxx). */
export function normaliseUgandanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('07')) return '256' + cleaned.slice(1)
  return cleaned
}

/** Zero-decimal currencies in Stripe that do not have subunits. */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
])

export function isZeroDecimalCurrency(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has((currency || '').toUpperCase())
}

export function toStripeSmallestUnit(amount: number, currency: string): number {
  if (isZeroDecimalCurrency(currency)) {
    return Math.round(amount)
  }
  return Math.round(amount * 100)
}

export function fromStripeSmallestUnit(amount: number, currency: string): number {
  if (isZeroDecimalCurrency(currency)) {
    return amount
  }
  return amount / 100
}

export interface StripeValidationResult {
  ok: boolean
  error?: string
  validAmount?: number
  validCurrency?: string
}

export function validateStripeDonation(amount: unknown, currency: unknown): StripeValidationResult {
  const cur = typeof currency === 'string' ? currency.trim().toUpperCase() : 'USD'
  const allowedCurrencies = ['USD', 'EUR', 'GBP', 'UGX']
  
  if (!allowedCurrencies.includes(cur)) {
    return { ok: false, error: `Unsupported currency '${cur}'. Supported currencies: ${allowedCurrencies.join(', ')}` }
  }

  const num = Number(amount)
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return { ok: false, error: 'Donation amount must be a positive number' }
  }

  // Min / Max rules matching frontend and Stripe requirements
  if (cur === 'UGX') {
    if (num < 5000) {
      return { ok: false, error: 'Minimum card donation in UGX is 5,000' }
    }
    if (num > 100_000_000) {
      return { ok: false, error: 'Maximum card donation in UGX is 100,000,000' }
    }
  } else {
    // USD, EUR, GBP
    if (num < 5) {
      return { ok: false, error: `Minimum card donation in ${cur} is 5.00` }
    }
    if (num > 25000) {
      return { ok: false, error: `Maximum card donation in ${cur} is 25,000.00` }
    }
  }

  return { ok: true, validAmount: num, validCurrency: cur }
}
