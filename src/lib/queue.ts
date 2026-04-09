import { QueueEvents, type JobsOptions, Queue } from 'bullmq'
import { Redis } from 'ioredis'

export const GUIDE_GENERATION_QUEUE_NAME = 'guide-generation'
export const GUIDE_GENERATION_DLQ_NAME = 'guide-generation-dlq'

export type GuideGenerationJobData = {
  guideId: string
}

export function createRedisConnection() {
  return new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
  })
}

export function createGuideGenerationQueue(connection: Redis) {
  return new Queue<GuideGenerationJobData>(GUIDE_GENERATION_QUEUE_NAME, {
    connection,
  })
}

export function createGuideGenerationDeadLetterQueue(connection: Redis) {
  return new Queue<GuideGenerationJobData & { reason: string }>(GUIDE_GENERATION_DLQ_NAME, {
    connection,
  })
}

export function createGuideGenerationQueueEvents(connection: Redis) {
  return new QueueEvents(GUIDE_GENERATION_QUEUE_NAME, {
    connection,
  })
}

export function createGuideJobOptions(guideId: string): JobsOptions {
  return {
    jobId: guideId,
    removeOnComplete: 100,
    removeOnFail: 100,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  }
}
