import type { PrismaClient } from '@prisma/client'
import type { Queue, QueueEvents } from 'bullmq'
import type { AppConfig } from '../config/env.js'
import type { GuideGenerationJobData } from '../lib/queue.js'

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig
    prisma: PrismaClient
    guideGenerationQueue: Queue<GuideGenerationJobData>
    guideGenerationQueueEvents: QueueEvents
    guideGenerationDeadLetterQueue: Queue<GuideGenerationJobData & { reason: string }>
  }
}

export {}
