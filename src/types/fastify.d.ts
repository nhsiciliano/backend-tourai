import type { PrismaClient } from '@prisma/client'
import type { AppConfig } from '../config/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig
    prisma: PrismaClient
  }
}

export {}
