import type { ICreateOrUpdateUserPayload } from '@repo/types/auth'
import { z } from 'zod'
import { EMAIL_REGEX, NAME_REGEX, PASSWORD_REGEX } from './validation.js'

/**
 * Authoritative registration validation schema, shared by the Fastify API
 * (request validation) and any frontend that wants to validate with the exact
 * same rules. Built from the regexes in `./validation` so the patterns never
 * drift from the client-side checks.
 */
export const registrationSchema = z.object({
  name: z.string().regex(NAME_REGEX),
  email: z.string().regex(EMAIL_REGEX),
  password: z.string().regex(PASSWORD_REGEX),
}) satisfies z.ZodType<ICreateOrUpdateUserPayload>

/** Inferred input type — identical in shape to `ICreateOrUpdateUserPayload`. */
export type RegistrationInput = z.infer<typeof registrationSchema>
