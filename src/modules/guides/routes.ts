import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { createGuide, getGuide, getGuideStatus } from './service.js'

const guideStatusSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('processing'),
  Type.Literal('ready'),
  Type.Literal('failed'),
])

const guideResponseSchema = Type.Object({
  id: Type.String(),
  status: guideStatusSchema,
  language: Type.Union([Type.Literal('es-AR'), Type.Literal('en')]),
  duration: Type.Union([Type.Literal('short'), Type.Literal('medium'), Type.Literal('long')]),
  detailLevel: Type.Union([Type.Literal('basic'), Type.Literal('standard'), Type.Literal('deep')]),
  script: Type.Union([Type.String(), Type.Null()]),
  provider: Type.Union([Type.String(), Type.Null()]),
  promptVersion: Type.Union([Type.String(), Type.Null()]),
  estimatedDurationSec: Type.Union([Type.Number(), Type.Null()]),
  place: Type.Union([
    Type.Object({
      id: Type.String(),
      slug: Type.String(),
      name: Type.Object({ es: Type.String(), en: Type.String() }),
      category: Type.String(),
      city: Type.String(),
      country: Type.String(),
      coordinates: Type.Object({ lat: Type.Number(), lng: Type.Number() }),
      featured: Type.Boolean(),
      editorialScore: Type.Number(),
      summarySeed: Type.Object({
        es: Type.Union([Type.String(), Type.Null()]),
        en: Type.Union([Type.String(), Type.Null()]),
      }),
      scientificRelevance: Type.Union([Type.String(), Type.Null()]),
      createdAt: Type.String(),
      updatedAt: Type.String(),
    }),
    Type.Null(),
  ]),
  audio: Type.Union([
    Type.Object({
      id: Type.String(),
      status: guideStatusSchema,
      mimeType: Type.String(),
      voiceCode: Type.Union([Type.String(), Type.Null()]),
      durationMs: Type.Union([Type.Number(), Type.Null()]),
      signedUrl: Type.Union([Type.String(), Type.Null()]),
    }),
    Type.Null(),
  ]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

const guidesRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    '/guides',
    {
      schema: {
        tags: ['guides'],
        body: Type.Object({
          placeId: Type.String(),
          language: Type.Union([Type.Literal('es-AR'), Type.Literal('en')]),
          duration: Type.Union([Type.Literal('short'), Type.Literal('medium'), Type.Literal('long')]),
          detailLevel: Type.Union([Type.Literal('basic'), Type.Literal('standard'), Type.Literal('deep')]),
        }),
        response: {
          200: Type.Object({
            cached: Type.Boolean(),
            enqueued: Type.Boolean(),
            guide: guideResponseSchema,
          }),
          202: Type.Object({
            cached: Type.Boolean(),
            enqueued: Type.Boolean(),
            guide: guideResponseSchema,
          }),
          404: Type.Object({
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const result = await createGuide(fastify, request.body)

      if ('error' in result) {
        reply.code(404)
        return { message: 'Place not found.' }
      }

      if (result.enqueued && !result.cached) {
        reply.code(202)
      }

      return result
    },
  )

  fastify.get(
    '/guides/:id',
    {
      schema: {
        tags: ['guides'],
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: guideResponseSchema,
          404: Type.Object({
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const guide = await getGuide(fastify, request.params.id)

      if (!guide) {
        reply.code(404)
        return { message: 'Guide not found.' }
      }

      return guide
    },
  )

  fastify.get(
    '/guides/:id/status',
    {
      schema: {
        tags: ['guides'],
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Object({
            id: Type.String(),
            status: guideStatusSchema,
            audioStatus: guideStatusSchema,
          }),
          404: Type.Object({
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const status = await getGuideStatus(fastify, request.params.id)

      if (!status) {
        reply.code(404)
        return { message: 'Guide not found.' }
      }

      return status
    },
  )
}

export default guidesRoutes
