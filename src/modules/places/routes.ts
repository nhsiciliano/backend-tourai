import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { getPlaceById, listPlaces } from './service.js'

const placeResponseSchema = Type.Object({
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
})

const placesRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/places',
    {
      schema: {
        tags: ['places'],
        querystring: Type.Object({
          featured: Type.Optional(Type.Boolean()),
        }),
        response: {
          200: Type.Object({
            items: Type.Array(placeResponseSchema),
          }),
        },
      },
    },
    async (request) => {
      return {
        items: await listPlaces(fastify, request.query.featured),
      }
    },
  )

  fastify.get(
    '/places/:id',
    {
      schema: {
        tags: ['places'],
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: placeResponseSchema,
          404: Type.Object({
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const place = await getPlaceById(fastify, request.params.id)

      if (!place) {
        reply.code(404)
        return { message: 'Place not found.' }
      }

      return place
    },
  )
}

export default placesRoutes
