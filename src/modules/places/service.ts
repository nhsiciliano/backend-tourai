import { PlaceCategory, type Place } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

const placeCategoryLabels: Record<PlaceCategory, string> = {
  MONUMENT: 'monument',
  PLAZA: 'plaza',
  RUIN: 'ruin',
  SCIENTIFIC_SITE: 'scientific_site',
  HISTORIC_SITE: 'historic_site',
}

function serializePlace(place: Place) {
  return {
    id: place.id,
    slug: place.slug,
    name: {
      es: place.nameEs,
      en: place.nameEn,
    },
    category: placeCategoryLabels[place.category],
    city: place.city,
    country: place.country,
    coordinates: {
      lat: Number(place.latitude),
      lng: Number(place.longitude),
    },
    featured: place.isFeatured,
    editorialScore: place.editorialScore,
    summarySeed: {
      es: place.summarySeedEs,
      en: place.summarySeedEn,
    },
    scientificRelevance: place.scientificRelevance,
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
  }
}

export async function listPlaces(app: FastifyInstance, featured?: boolean) {
  const places = await app.prisma.place.findMany({
    ...(typeof featured === 'boolean' ? { where: { isFeatured: featured } } : {}),
    orderBy: [{ isFeatured: 'desc' }, { editorialScore: 'desc' }, { nameEs: 'asc' }],
  })

  return places.map(serializePlace)
}

export async function getPlaceById(app: FastifyInstance, id: string) {
  const place = await app.prisma.place.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  })

  return place ? serializePlace(place) : null
}
