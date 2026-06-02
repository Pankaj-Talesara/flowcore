import { ICreateOrUpdateUserPayload, ICreateOrUpdateUserResponse } from '@repo/types/auth'
import { type FastifyPluginAsync } from 'fastify'

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{
    Body: ICreateOrUpdateUserPayload
    Reply: ICreateOrUpdateUserResponse
  }>('/users', async function ({ body }) {
    return {
      accessToken: body.email,
      refreshToken: body.password,
      userId: body.email + body.password,
    }
  })
}

export default root
