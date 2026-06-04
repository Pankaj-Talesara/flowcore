import jwt from 'jsonwebtoken'
import { User } from '../generated/prisma/client'
import { FastifyReply } from 'fastify'

export const generateAndAttachAuthTokens = (user: User, reply: FastifyReply) => {
  const tokenPayload = { email: user.email, userId: user.id, name: user.name }

  const accessToken = jwt.sign(tokenPayload, process.env.AUTH_SECRET!, {
    expiresIn: Number(process.env.AUTH_SECRET_EXPIRES_IN!),
  })

  const refreshToken = jwt.sign(tokenPayload, process.env.AUTH_REFRESH_SECRET!, {
    expiresIn: Number(process.env.AUTH_REFRESH_SECRET_EXPIRES_IN),
  })

  reply.setCookie('accessToken', accessToken, { maxAge: 60 * 60 })
  reply.setCookie('refreshToken', refreshToken, { maxAge: 30 * 24 * 60 * 60 })
}
