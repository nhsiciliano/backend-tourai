import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { getPrismaClient } from '../lib/prisma.js'

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient()

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}

export default fp(prismaPlugin, {
  name: 'prisma',
})
