import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { getPlaceById } from '../places/service.js'
import { resolvePlaceByLocation } from './service.js'

const resolvedPlaceSchema = Type.Object({
  matchType: Type.String(),
  confidenceScore: Type.Number(),
  distanceMeters: Type.Number(),
  place: Type.Union([
    Type.Object({
      id: Type.String(),
      slug: Type.String(),
      name: Type.Object({
        es: Type.String(),
        en: Type.String(),
      }),
      category: Type.String(),
      city: Type.String(),
      country: Type.String(),
      coordinates: Type.Object({
        lat: Type.Number(),
        lng: Type.Number(),
      }),
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
  nearby: Type.Array(
    Type.Object({
      id: Type.String(),
      slug: Type.String(),
      nameEs: Type.String(),
      nameEn: Type.String(),
      distanceMeters: Type.Number(),
      score: Type.Number(),
      featured: Type.Boolean(),
    }),
  ),
})

const locationRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    '/location/resolve',
    {
      schema: {
        tags: ['location'],
        body: Type.Object({
          lat: Type.Number(),
          lng: Type.Number(),
          language: Type.Optional(Type.Union([Type.Literal('es-AR'), Type.Literal('en')])),
        }),
        response: {
          200: resolvedPlaceSchema,
          404: Type.Object({
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const resolution = await resolvePlaceByLocation(fastify, request.body)

      if (!resolution) {
        reply.code(404)
        return { message: 'No places available to resolve location.' }
      }

      const place = await getPlaceById(fastify, resolution.placeId)

      return {
        matchType: resolution.matchType,
        confidenceScore: resolution.confidenceScore,
        distanceMeters: resolution.distanceMeters,
        place,
        nearby: resolution.nearby,
      }
    },
  )
}

export default locationRoutes
