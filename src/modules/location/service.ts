import type { Place } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

type ResolveInput = {
  lat: number
  lng: number
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function distanceInMeters(from: ResolveInput, to: ResolveInput) {
  const earthRadius = 6371000
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadius * c
}

function scoreCandidate(place: Place, distanceMeters: number) {
  const featuredBoost = place.isFeatured ? 35 : 0
  const editorialBoost = Math.min(place.editorialScore, 100) * 0.35
  const distancePenalty = Math.min(distanceMeters, 1500) / 12

  return featuredBoost + editorialBoost - distancePenalty
}

function confidenceFromDistance(distanceMeters: number) {
  if (distanceMeters <= 30) return 0.98
  if (distanceMeters <= 75) return 0.92
  if (distanceMeters <= 150) return 0.84
  if (distanceMeters <= 300) return 0.72
  if (distanceMeters <= 600) return 0.58
  return 0.42
}

export async function resolvePlaceByLocation(app: FastifyInstance, input: ResolveInput) {
  const places = await app.prisma.place.findMany({
    orderBy: [{ isFeatured: 'desc' }, { editorialScore: 'desc' }],
  })

  if (places.length === 0) {
    return null
  }

  const candidates = places
    .map((place) => {
      const distanceMeters = distanceInMeters(input, {
        lat: Number(place.latitude),
        lng: Number(place.longitude),
      })

      return {
        place,
        distanceMeters,
        score: scoreCandidate(place, distanceMeters),
      }
    })
    .sort((left, right) => right.score - left.score)

  const best = candidates[0]

  if (!best) {
    return null
  }
  const nearby = candidates.slice(0, 3).map((candidate) => ({
    id: candidate.place.id,
    slug: candidate.place.slug,
    nameEs: candidate.place.nameEs,
    nameEn: candidate.place.nameEn,
    distanceMeters: Math.round(candidate.distanceMeters),
    score: Number(candidate.score.toFixed(2)),
    featured: candidate.place.isFeatured,
  }))

  return {
    placeId: best.place.id,
    placeSlug: best.place.slug,
    matchType: best.distanceMeters <= 75 ? 'nearest_featured_or_curated' : 'nearest_candidate',
    confidenceScore: Number(confidenceFromDistance(best.distanceMeters).toFixed(2)),
    distanceMeters: Math.round(best.distanceMeters),
    nearby,
  }
}
