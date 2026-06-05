import { generateAndAttachAuthTokens, removeAuthTokens, verifyRefreshToken } from '@lib/auth'
import { prisma } from '@prisma-client'
import {
  ICreateOrUpdateUserPayload,
  IUserLoginPayload,
  TCreateOrUpdateUserResponse,
  TRefreshTokenResponse,
} from '@repo/types/auth'
import { registrationSchema } from '@repo/utils/schema'
import bcrypt from 'bcrypt'
import { type FastifyPluginAsync } from 'fastify'

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{
    Body: ICreateOrUpdateUserPayload
  }>('/register', async function ({ body }, reply): Promise<TCreateOrUpdateUserResponse> {
    const isUserWithEmailExist = await prisma.user.findFirst({ where: { email: body.email } })

    const validations = registrationSchema.safeParse(body)

    if (!validations.success) {
      const errorKey = validations.error.issues[0]?.path[0]
      reply.status(422)

      switch (errorKey) {
        case 'email':
          return {
            code: 'INVALID_EMAIL',
            message: 'Email should be a valid email address',
          }

        case 'password':
          return {
            code: 'INVALID_PASSWORD',
            message: 'Password should contain at least 8 characters and maximum of 32 characters',
          }

        case 'name':
          return {
            code: 'INVALID_NAME',
            message: 'Name should be of minimum 3 characters and not contain special characters',
          }
      }
    }

    if (isUserWithEmailExist) {
      reply.status(409)
      return {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email already exists',
      }
    }

    const hashedPassword = await bcrypt.hash(body.password, 12)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        updatedAt: new Date(),
      },
    })

    generateAndAttachAuthTokens(user, reply)

    return { message: 'Auth token added to cookies.', userId: user.id }
  })

  fastify.post<{
    Body: IUserLoginPayload
  }>('/login', async function ({ body }, reply): Promise<TCreateOrUpdateUserResponse> {
    const user = await prisma.user.findFirst({ where: { email: body.email } })

    if (!user) {
      reply.status(404)

      return {
        code: 'INVALID_EMAIL',
        message: `User with email ${body.email} doesn't exists`,
      }
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password)

    if (!isPasswordValid) {
      reply.status(401)
      return {
        code: 'INVALID_PASSWORD',
        message: `Invalid Password`,
      }
    }

    generateAndAttachAuthTokens(user, reply)

    return { message: 'Auth token added to cookies.', userId: user.id }
  })

  fastify.delete('/logout', async function (_, reply): Promise<{ message: string }> {
    removeAuthTokens(reply)

    return { message: 'Auth tokens removed. You may logout now' }
  })

  fastify.post('/refresh', async function (request, reply): Promise<TRefreshTokenResponse> {
    const { refreshToken } = request.cookies || {}

    if (!refreshToken) {
      reply.status(401)
      return { code: 'NO_TOKEN_FOUND', message: 'No refresh token found in cookie' }
    }

    const userJwt = verifyRefreshToken(refreshToken)

    if (!userJwt) {
      reply.status(401)
      return { code: 'INVALID_TOKEN', message: 'Token is not a valid token.' }
    }

    const user = await prisma.user.findFirst({ where: { id: userJwt.userId } })

    if (!user) {
      reply.status(401)
      return { code: 'INVALID_TOKEN', message: 'Token is not a valid token.' }
    }

    generateAndAttachAuthTokens(user, reply, false)

    return { userId: user.id, message: 'Auth tokens refreshed in cookies' }
  })
}

export default root
