import type { FastifyPluginAsync } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../../auth.js'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: ['GET', 'POST', 'OPTIONS'],
    url: '/auth/*',
    handler: async (request, reply) => {
      const url = new URL(request.raw.url ?? request.url, fastify.config.BETTER_AUTH_URL)
      const headers = fromNodeHeaders(request.headers)

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...((request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS')
          ? {}
          : { body: JSON.stringify(request.body ?? {}) }),
      })

      const response = await auth.handler(req)

      reply.status(response.status)

      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })

      const body = response.body ? await response.text() : null
      reply.send(body)
    },
  })
}

export default authRoutes
