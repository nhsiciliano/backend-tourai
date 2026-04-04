import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

const rootRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['system'],
        response: {
          200: Type.Object({
            service: Type.String(),
            environment: Type.Object({
              node: Type.String(),
              port: Type.Number(),
            }),
          }),
        },
      },
    },
    async () => {
      return {
        service: 'tourai-backend',
        environment: {
          node: process.version,
          port: fastify.config.PORT,
        },
      }
    },
  )
}

export default rootRoutes
