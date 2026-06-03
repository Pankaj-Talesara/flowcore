import { THealthCheckSuccessResponse } from '@repo/types/health'
import { type FastifyPluginAsync } from 'fastify'
import { prisma } from '@prisma-client'

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async function (_request, reply): Promise<THealthCheckSuccessResponse> {
    try {
      await prisma.$queryRaw`SELECT 1`

      return { status: 'ok', timestamp: new Date() }
    } catch (e) {
      fastify.log.error(e, 'Health check failed: database unreachable')

      reply.code(503)
      return { code: 'HEALTH_CHECK_FAILED', message: 'Database is unreachable' }
    }
  })
}

export default root
