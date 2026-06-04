import { prisma } from '@prisma-client'
import { FastifyPluginAsync } from 'fastify'
import { User } from '../../generated/prisma/client'
import { WithError } from '@repo/types/common'

const Profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply): Promise<WithError<User>> => {
      const userId = request.user?.userId

      if (!userId) {
        reply.status(401)
        return { code: 'UNAUTHORIZED', message: 'Not authenticated' }
      }

      const user = await prisma.user.findFirst({ where: { id: userId } })

      if (!user) {
        reply.status(404)
        return { code: 'USER_NOT_EXISTS', message: "User doesn't exist" }
      }

      return user
    },
  )
}

export default Profile
