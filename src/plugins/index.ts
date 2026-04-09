import type { FastifyInstance } from 'fastify'
import type { AppConfig } from '../config/env.js'
import configPlugin from './config.js'
import corsPlugin from './cors.js'
import prismaPlugin from './prisma.js'
import queuePlugin from './queue.js'

export async function registerPlugins(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(configPlugin, { config })
  await app.register(corsPlugin)
  await app.register(prismaPlugin)
  await app.register(queuePlugin)
}
