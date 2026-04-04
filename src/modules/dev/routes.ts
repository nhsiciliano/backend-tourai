import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { SignJWT } from 'jose'

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
}

export default devRoutes
