/**
 * Auth field validation rules — the single source of truth shared by the
 * Next.js client (instant, optimistic feedback) and the Zod schemas in
 * `./schema` that the Fastify API enforces (the authority). Keep these in sync
 * by importing them; never re-declare the patterns in an app.
 */

/** Letters and spaces, 3–15 characters. */
export const NAME_REGEX = /^[a-zA-Z ]{3,15}$/

/** Alphanumeric, 8–30 characters. */
export const PASSWORD_REGEX = /^[a-zA-Z0-9]{8,30}$/

/** Pragmatic email shape check for client-side feedback. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidName(value: string): boolean {
  return NAME_REGEX.test(value)
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value)
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}
