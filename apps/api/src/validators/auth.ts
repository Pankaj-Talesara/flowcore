import joi from 'joi'
import { User } from '../generated/prisma/client'

export const registrationSchema = joi.object<User>({
  name: joi.string().regex(new RegExp('^[a-zA-Z ]{3,15}$')),
  email: joi.string().email({ minDomainSegments: 2 }),
  password: joi.string().min(8).max(32).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
})
