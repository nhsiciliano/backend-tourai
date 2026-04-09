import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { SignJWT } from 'jose'
import { pregenerateFeaturedGuides } from '../guides/pregeneration.js'

function extractToken(identifier: string, prefix: string) {
  return identifier.startsWith(prefix) ? identifier.slice(prefix.length) : null
}

async function createVerificationToken(email: string, secret: string) {
  return new SignJWT({
    email: email.toLowerCase(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))
}

const devRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/dev/auth/debug/:email',
    {
      schema: {
        tags: ['dev'],
        params: Type.Object({
          email: Type.String({ format: 'email' }),
        }),
      },
    },
    async (request, reply) => {
      const user = await fastify.prisma.user.findUnique({
        where: { email: request.params.email },
      })

      if (!user) {
        reply.code(404)
        return { message: 'User not found.' }
      }

      const verifications = await fastify.prisma.verification.findMany({
        where: {
          OR: [{ value: user.id }, { value: user.email }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const latestReset = verifications
        .map((verification) => ({
          token: extractToken(verification.identifier, 'reset-password:'),
          createdAt: verification.createdAt.toISOString(),
          expiresAt: verification.expiresAt.toISOString(),
        }))
        .find((verification) => verification.token)

      const latestEmailVerification = verifications
        .map((verification) => ({
          token: extractToken(verification.identifier, 'email-verification:'),
          createdAt: verification.createdAt.toISOString(),
          expiresAt: verification.expiresAt.toISOString(),
        }))
        .find((verification) => verification.token)

      const generatedVerificationToken = user.emailVerified
        ? null
        : await createVerificationToken(user.email, fastify.config.BETTER_AUTH_SECRET)

      return {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        generatedVerification: generatedVerificationToken
          ? {
              token: generatedVerificationToken,
              url: `${fastify.config.BETTER_AUTH_URL}/auth/verify-email?token=${generatedVerificationToken}&callbackURL=${encodeURIComponent('http://localhost:8081/verify-email')}`,
            }
          : null,
        latestReset,
        latestEmailVerification,
      }
    },
  )

  fastify.post(
    '/dev/guides/pregenerate-featured',
    {
      schema: {
        tags: ['dev'],
        body: Type.Object({
          dryRun: Type.Optional(Type.Boolean()),
          limit: Type.Optional(Type.Number({ minimum: 1 })),
        }),
      },
    },
    async (request) => {
      return pregenerateFeaturedGuides(fastify, {
        ...(typeof request.body.dryRun === 'boolean' ? { dryRun: request.body.dryRun } : {}),
        ...(typeof request.body.limit === 'number' ? { limit: request.body.limit } : {}),
      })
    },
  )

  fastify.get(
    '/dev/queues/stats',
    async () => {
      const [waiting, active, completed, failed, delayed, deadLetterCount] = await Promise.all([
        fastify.guideGenerationQueue.getWaitingCount(),
        fastify.guideGenerationQueue.getActiveCount(),
        fastify.guideGenerationQueue.getCompletedCount(),
        fastify.guideGenerationQueue.getFailedCount(),
        fastify.guideGenerationQueue.getDelayedCount(),
        fastify.guideGenerationDeadLetterQueue.count(),
      ])

      return {
        guideGeneration: {
          waiting,
          active,
          completed,
          failed,
          delayed,
        },
        deadLetter: {
          count: deadLetterCount,
        },
      }
    },
  )

  fastify.get(
    '/dev/guides/failures',
    {
      schema: {
        tags: ['dev'],
        querystring: Type.Object({
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50 })),
        }),
      },
    },
    async (request) => {
      const limit = request.query.limit ?? 10
      const failedGuides = await fastify.prisma.generatedGuide.findMany({
        where: {
          status: 'FAILED',
        },
        include: {
          place: true,
          audioAssets: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      })

      return {
        items: failedGuides.map((guide) => ({
          id: guide.id,
          placeSlug: guide.place.slug,
          language: guide.language,
          duration: guide.duration,
          detailLevel: guide.detailLevel,
          attempts: guide.generationAttempts,
          lastError: guide.lastError,
          generationStartedAt: guide.generationStartedAt?.toISOString() ?? null,
          generationCompletedAt: guide.generationCompletedAt?.toISOString() ?? null,
          updatedAt: guide.updatedAt.toISOString(),
          audioLastError: guide.audioAssets[0]?.lastError ?? null,
        })),
      }
    },
  )

  fastify.get(
    '/dev/operations/overview',
    async () => {
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [waiting, active, completed, failed, deadLetterCount, guideCounts, recentGuides] = await Promise.all([
        fastify.guideGenerationQueue.getWaitingCount(),
        fastify.guideGenerationQueue.getActiveCount(),
        fastify.guideGenerationQueue.getCompletedCount(),
        fastify.guideGenerationQueue.getFailedCount(),
        fastify.guideGenerationDeadLetterQueue.count(),
        fastify.prisma.generatedGuide.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        fastify.prisma.generatedGuide.findMany({
          include: {
            place: true,
            audioAssets: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),
      ])

      const recentProviderSummary = await fastify.prisma.generatedGuide.groupBy({
        by: ['provider', 'ttsProvider'],
        where: {
          updatedAt: {
            gte: last24Hours,
          },
        },
        _count: { _all: true },
      })

      return {
        queues: {
          guideGeneration: {
            waiting,
            active,
            completed,
            failed,
          },
          deadLetter: {
            count: deadLetterCount,
          },
        },
        guides: {
          byStatus: guideCounts.map((item) => ({
            status: item.status,
            count: item._count._all,
          })),
          providersLast24h: recentProviderSummary.map((item) => ({
            provider: item.provider,
            ttsProvider: item.ttsProvider,
            count: item._count._all,
          })),
          recent: recentGuides.map((guide) => ({
            id: guide.id,
            placeSlug: guide.place.slug,
            status: guide.status,
            provider: guide.provider,
            ttsProvider: guide.ttsProvider,
            fallbackUsed: guide.fallbackUsed,
            attempts: guide.generationAttempts,
            llmLatencyMs: guide.llmLatencyMs,
            ttsLatencyMs: guide.ttsLatencyMs,
            scriptWordCount: guide.scriptWordCount,
            audioBytes: guide.audioAssets[0]?.audioBytes ?? null,
            lastError: guide.lastError,
            updatedAt: guide.updatedAt.toISOString(),
          })),
        },
      }
    },
  )
}

export default devRoutes
