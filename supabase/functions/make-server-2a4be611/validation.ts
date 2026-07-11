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
