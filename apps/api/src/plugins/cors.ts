import fastifyCors from '@fastify/cors'
import fp from 'fastify-plugin'

export default fp(async (fastify) => {
  const allowed = (process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  await fastify.register(fastifyCors, {
    origin: allowed.length === 1 ? allowed[0] : allowed,
    credentials: true,
  })
})
