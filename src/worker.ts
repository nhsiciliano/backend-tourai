import { Worker } from 'bullmq'
import { buildApp } from './app.js'
import { loadConfig } from './config/env.js'
import { GUIDE_GENERATION_QUEUE_NAME, createGuideGenerationDeadLetterQueue, createRedisConnection, type GuideGenerationJobData } from './lib/queue.js'
import { processGuideGeneration } from './modules/guides/service.js'

async function startWorker() {
  const config = loadConfig()
  const app = await buildApp(config)
  const workerConnection = createRedisConnection()
  const deadLetterConnection = createRedisConnection()
  const deadLetterQueue = createGuideGenerationDeadLetterQueue(deadLetterConnection)

  const worker = new Worker<GuideGenerationJobData>(
    GUIDE_GENERATION_QUEUE_NAME,
    async (job) => {
      await processGuideGeneration(app, job.data.guideId)
    },
    {
      connection: workerConnection,
      concurrency: 1,
    },
  )

  worker.on('ready', () => {
    app.log.info('Guide generation worker is ready')
  })

  worker.on('completed', (job) => {
    app.log.info({ jobId: job.id }, 'Guide generation job completed')
  })

  worker.on('failed', (job, error) => {
    app.log.error({ err: error, jobId: job?.id }, 'Guide generation job failed')
  })

  worker.on('failed', async (job, error) => {
    if (!job?.data?.guideId) {
      return
    }

    await deadLetterQueue.add(
      'guide-generation-failed',
      {
        guideId: job.data.guideId,
        reason: error.message,
      },
      {
        removeOnComplete: 500,
        removeOnFail: 500,
      },
    )
  })

  const shutdown = async () => {
    app.log.info('Shutting down guide generation worker')
    await worker.close()
    await deadLetterQueue.close()
    await deadLetterConnection.quit()
    await workerConnection.quit()
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', () => {
    void shutdown()
  })

  process.on('SIGTERM', () => {
    void shutdown()
  })
}

void startWorker().catch((error) => {
  console.error(error)
  process.exit(1)
})
