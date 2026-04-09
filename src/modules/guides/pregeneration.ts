import type { FastifyInstance } from 'fastify'
import { enqueueGuideGeneration, waitForGuideJob } from './service.js'
import type { GuideDetailInput, GuideDurationInput, GuideLanguageInput } from './types.js'

export type PregenerationVariant = {
  language: GuideLanguageInput
  duration: GuideDurationInput
  detailLevel: GuideDetailInput
}

export type PregenerationOptions = {
  limit?: number
  dryRun?: boolean
  variants?: PregenerationVariant[]
}

export const defaultFeaturedVariants: PregenerationVariant[] = [
  { language: 'es-AR', duration: 'short', detailLevel: 'basic' },
  { language: 'es-AR', duration: 'medium', detailLevel: 'standard' },
  { language: 'en', duration: 'short', detailLevel: 'basic' },
  { language: 'en', duration: 'medium', detailLevel: 'standard' },
]

export async function pregenerateFeaturedGuides(app: FastifyInstance, options: PregenerationOptions = {}) {
  const variants = options.variants ?? defaultFeaturedVariants
  const featuredPlaces = await app.prisma.place.findMany({
    where: { isFeatured: true },
    orderBy: [{ editorialScore: 'desc' }, { nameEs: 'asc' }],
    ...(typeof options.limit === 'number' ? { take: options.limit } : {}),
  })

  const planned = featuredPlaces.flatMap((place) =>
    variants.map((variant) => ({
      placeId: place.id,
      placeSlug: place.slug,
      ...variant,
    })),
  )

  if (options.dryRun) {
    return {
      dryRun: true,
      places: featuredPlaces.length,
      totalVariants: planned.length,
      planned,
    }
  }

  let created = 0
  let cached = 0
  let failed = 0
  const results: Array<Record<string, string | boolean>> = []

  for (const item of planned) {
    try {
      const result = await enqueueGuideGeneration(app, {
        placeId: item.placeId,
        language: item.language,
        duration: item.duration,
        detailLevel: item.detailLevel,
      })

      if ('error' in result) {
        failed += 1
        results.push({
          placeSlug: item.placeSlug,
          language: item.language,
          duration: item.duration,
          detailLevel: item.detailLevel,
          status: 'failed',
          reason: result.error,
        })
        continue
      }

      if (result.enqueued) {
        await waitForGuideJob(app, result.guide.id)
      }

      if (result.cached) {
        cached += 1
      } else {
        created += 1
      }

      results.push({
        placeSlug: item.placeSlug,
        language: item.language,
        duration: item.duration,
        detailLevel: item.detailLevel,
        cached: String(result.cached),
        status: result.guide.status,
      })
    } catch (error) {
      failed += 1
      results.push({
        placeSlug: item.placeSlug,
        language: item.language,
        duration: item.duration,
        detailLevel: item.detailLevel,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    dryRun: false,
    places: featuredPlaces.length,
    totalVariants: planned.length,
    created,
    cached,
    failed,
    results,
  }
}
