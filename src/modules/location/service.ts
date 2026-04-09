import { Prisma } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

type ResolveInput = {
  lat: number
  lng: number
}

type LocationCandidateRow = {
  id: string
  slug: string
  nameEs: string
  nameEn: string
  featured: boolean
  editorialScore: number
  distanceMeters: number
  score: number
}

function confidenceFromDistance(distanceMeters: number) {
  if (distanceMeters <= 20) return 0.99
  if (distanceMeters <= 50) return 0.95
  if (distanceMeters <= 100) return 0.88
  if (distanceMeters <= 250) return 0.78
  if (distanceMeters <= 500) return 0.64
  return 0.48
}

function resolveMatchType(candidate: LocationCandidateRow) {
  if (candidate.distanceMeters <= 30) {
    return 'immediate_proximity'
  }

  if (candidate.featured || candidate.distanceMeters <= 150) {
    return 'nearest_featured_or_curated'
  }

  return 'nearest_candidate'
}

export async function resolvePlaceByLocation(app: FastifyInstance, input: ResolveInput) {
  const userLng = Number(input.lng)
  const userLat = Number(input.lat)

  const candidates = await app.prisma.$queryRaw<LocationCandidateRow[]>(Prisma.sql`
    with user_point as (
      select st_setsrid(st_makepoint(${userLng}, ${userLat}), 4326)::geography as geog
    )
    select
      p.id,
      p.slug,
      p."nameEs",
      p."nameEn",
      p."isFeatured" as featured,
      p."editorialScore" as "editorialScore",
      st_distance(
        st_setsrid(st_makepoint(p.longitude::double precision, p.latitude::double precision), 4326)::geography,
        user_point.geog
      )::double precision as "distanceMeters",
      (
        case when p."isFeatured" then 35 else 0 end
        + least(p."editorialScore", 100) * 0.35
        - least(
          st_distance(
            st_setsrid(st_makepoint(p.longitude::double precision, p.latitude::double precision), 4326)::geography,
            user_point.geog
          )::double precision,
          1500
        ) / 12
      )::double precision as score
    from public.places p
    cross join user_point
    order by score desc, "distanceMeters" asc
    limit 3
  `)

  const best = candidates[0]

  if (!best) {
    return null
  }

  return {
    placeId: best.id,
    placeSlug: best.slug,
    matchType: resolveMatchType(best),
    confidenceScore: Number(confidenceFromDistance(best.distanceMeters).toFixed(2)),
    distanceMeters: Math.round(best.distanceMeters),
    nearby: candidates.map((candidate) => ({
      id: candidate.id,
      slug: candidate.slug,
      nameEs: candidate.nameEs,
      nameEn: candidate.nameEn,
      distanceMeters: Math.round(candidate.distanceMeters),
      score: Number(candidate.score.toFixed(2)),
      featured: candidate.featured,
    })),
  }
}
