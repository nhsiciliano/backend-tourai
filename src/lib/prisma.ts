import { PrismaClient } from '@prisma/client'

let prismaSingleton: PrismaClient | undefined

export function getPrismaClient(): PrismaClient {
  prismaSingleton ??= new PrismaClient()
  return prismaSingleton
}
