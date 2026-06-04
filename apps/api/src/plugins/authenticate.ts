import { verifyAccessToken } from '@lib/auth'
import { UserJwtPayload } from '@repo/types/auth'
import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

/**
 * Adds an `authenticate` preHandler that verifies the JWT access token from the
 * `accessToken` cookie and attaches the decoded payload to `request.user`.
 *
 * Usage: `fastify.get('/me', { preHandler: [fastify.authenticate] }, handler)`
 */
export default fp(async (fastify) => {
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { accessToken } = request.cookies || {}

      if (!accessToken) {
        reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
        return
      }

      const user = verifyAccessToken(accessToken)

      if (!user) {
        reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
        return
      }

      request.user = user
    },
  )
})

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  export interface FastifyRequest {
    user?: UserJwtPayload
  }
}
