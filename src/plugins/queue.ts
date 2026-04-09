import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { createGuideGenerationDeadLetterQueue, createGuideGenerationQueue, createGuideGenerationQueueEvents, createRedisConnection } from '../lib/queue.js'

const queuePlugin: FastifyPluginAsync = async (fastify) => {
  const queueConnection = createRedisConnection()
  const eventsConnection = createRedisConnection()
  const deadLetterConnection = createRedisConnection()

  const guideGenerationQueue = createGuideGenerationQueue(queueConnection)
  const guideGenerationQueueEvents = createGuideGenerationQueueEvents(eventsConnection)
  const guideGenerationDeadLetterQueue = createGuideGenerationDeadLetterQueue(deadLetterConnection)

  await guideGenerationQueueEvents.waitUntilReady()

  fastify.decorate('guideGenerationQueue', guideGenerationQueue)
  fastify.decorate('guideGenerationQueueEvents', guideGenerationQueueEvents)
  fastify.decorate('guideGenerationDeadLetterQueue', guideGenerationDeadLetterQueue)

  fastify.addHook('onClose', async () => {
    await guideGenerationQueueEvents.close()
    await guideGenerationDeadLetterQueue.close()
    await guideGenerationQueue.close()
    await deadLetterConnection.quit()
    await eventsConnection.quit()
    await queueConnection.quit()
  })
}

export default fp(queuePlugin, {
  name: 'queue',
  dependencies: ['config', 'prisma'],
})
