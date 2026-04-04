import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

const healthRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        response: {
          200: Type.Object({
            status: Type.Literal('ok'),
          }),
        },
      },
    },
    async () => {
      return { status: 'ok' as const }
    },
  )
}

export default healthRoutes
