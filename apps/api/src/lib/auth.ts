import { CookieSerializeOptions } from '@fastify/cookie'
import { UserJwtPayload } from '@repo/types/auth'
import { FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { User } from '../generated/prisma/client'

export const cookieDefaults: CookieSerializeOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}

export const generateAndAttachAuthTokens = (
  user: User,
  reply: FastifyReply,
  attachRefreshToken = true,
) => {
  const tokenPayload: UserJwtPayload = { email: user.email, userId: user.id, name: user.name }

  const accessToken = jwt.sign(tokenPayload, process.env.AUTH_SECRET!, {
    expiresIn: Number(process.env.AUTH_SECRET_EXPIRES_IN!),
  })

  reply.setCookie('accessToken', accessToken, { ...cookieDefaults, maxAge: 60 * 60 })

  if (attachRefreshToken) {
    const refreshToken = jwt.sign(tokenPayload, process.env.AUTH_REFRESH_SECRET!, {
      expiresIn: Number(process.env.AUTH_REFRESH_SECRET_EXPIRES_IN),
    })

    reply.setCookie('refreshToken', refreshToken, { ...cookieDefaults, maxAge: 30 * 24 * 60 * 60 })
  }
}

export const removeAuthTokens = (reply: FastifyReply) => {
  reply.setCookie('accessToken', '', { ...cookieDefaults, expires: new Date(0) })
  reply.setCookie('refreshToken', '', { ...cookieDefaults, expires: new Date(0) })
}

export const verifyAccessToken = (accessToken: string): UserJwtPayload | null => {
  try {
    return jwt.verify(accessToken, process.env.AUTH_SECRET!) as UserJwtPayload
  } catch {
    return null
  }
}

export const verifyRefreshToken = (refreshToken: string): UserJwtPayload | null => {
  try {
    return jwt.verify(refreshToken, process.env.AUTH_REFRESH_SECRET!) as UserJwtPayload
  } catch {
    return null
  }
}
