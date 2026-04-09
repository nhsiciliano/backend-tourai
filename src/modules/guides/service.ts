import { createHash } from 'node:crypto'
import { ProcessingStatus } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { createGuideJobOptions, type GuideGenerationJobData } from '../../lib/queue.js'
import { getPlaceById } from '../places/service.js'
import { fromGuideDetailLevel, fromGuideDuration, fromGuideLanguage, fromProcessingStatus, toGuideDetailLevel, toGuideDuration, toGuideLanguage } from './mappers.js'
import { buildFallbackGuideScript, buildGuidePrompt } from './prompt.js'
import { synthesizeSpeechWithElevenLabs } from './providers/elevenlabs.js'
import { generateGuideWithGemini } from './providers/gemini.js'
import { createGuideAudioSignedUrl, uploadGuideAudio } from './storage.js'
import type { GuideRequestInput } from './types.js'

const PROMPT_VERSION = 'v1'

type GuideQueueResult = {
  guide: Awaited<ReturnType<typeof requireGuideResponse>>
  cached: boolean
  created: boolean
  enqueued: boolean
}

type GuideQueueError = {
  error: 'PLACE_NOT_FOUND'
}

function buildInputHash(input: GuideRequestInput) {
  return createHash('sha256').update(JSON.stringify({ ...input, promptVersion: PROMPT_VERSION })).digest('hex')
}

async function buildGuideResponse(app: FastifyInstance, guideId: string) {
  const guide = await app.prisma.generatedGuide.findUnique({
    where: { id: guideId },
    include: {
      place: true,
      audioAssets: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!guide) {
    return null
  }

  const audio = guide.audioAssets[0] ?? null
  const audioUrl = audio && audio.status === ProcessingStatus.READY ? await createGuideAudioSignedUrl(audio.storagePath) : null

  return {
    id: guide.id,
    status: fromProcessingStatus(guide.status),
    language: fromGuideLanguage(guide.language),
    duration: fromGuideDuration(guide.duration),
    detailLevel: fromGuideDetailLevel(guide.detailLevel),
    script: guide.script,
    provider: guide.provider,
    promptVersion: guide.promptVersion,
    estimatedDurationSec: guide.estimatedDurationSec,
    place: await getPlaceById(app, guide.placeId),
    audio: audio
      ? {
          id: audio.id,
          status: fromProcessingStatus(audio.status),
          mimeType: audio.mimeType,
          voiceCode: audio.voiceCode,
          durationMs: audio.durationMs,
          signedUrl: audioUrl,
        }
      : null,
    createdAt: guide.createdAt.toISOString(),
    updatedAt: guide.updatedAt.toISOString(),
  }
}

async function requireGuideResponse(app: FastifyInstance, guideId: string) {
  const guide = await buildGuideResponse(app, guideId)

  if (!guide) {
    throw new Error(`Guide ${guideId} was not found after creation.`)
  }

  return guide
}

async function ensureGuideRecord(app: FastifyInstance, input: GuideRequestInput) {
  const place = await app.prisma.place.findFirst({
    where: {
      OR: [{ id: input.placeId }, { slug: input.placeId }],
    },
  })

  if (!place) {
    return { error: 'PLACE_NOT_FOUND' as const }
  }

  const normalizedInput = { ...input, placeId: place.id }
  const inputHash = buildInputHash(normalizedInput)
  const existing = await app.prisma.generatedGuide.findUnique({ where: { inputHash } })

  if (existing && existing.status !== ProcessingStatus.FAILED) {
    return {
      guide: await requireGuideResponse(app, existing.id),
      cached: existing.status === ProcessingStatus.READY,
      created: false,
    }
  }

  const guide = existing
    ? await app.prisma.generatedGuide.update({
        where: { id: existing.id },
        data: {
          script: null,
          provider: null,
          estimatedDurationSec: null,
          status: ProcessingStatus.PENDING,
          lastError: null,
          generationStartedAt: null,
          generationCompletedAt: null,
        },
      })
    : await app.prisma.generatedGuide.create({
        data: {
          placeId: place.id,
          language: toGuideLanguage(input.language),
          duration: toGuideDuration(input.duration),
          detailLevel: toGuideDetailLevel(input.detailLevel),
          inputHash,
          promptVersion: PROMPT_VERSION,
          status: ProcessingStatus.PENDING,
        },
      })

  return {
    guide: await requireGuideResponse(app, guide.id),
    cached: false,
    created: true,
  }
}

export async function enqueueGuideGeneration(app: FastifyInstance, input: GuideRequestInput): Promise<GuideQueueResult | GuideQueueError> {
  const prepared = await ensureGuideRecord(app, input)

  if ('error' in prepared) {
    return { error: 'PLACE_NOT_FOUND' }
  }

  if (prepared.cached && prepared.guide.status === 'ready') {
    return {
      ...prepared,
      enqueued: false,
    } satisfies GuideQueueResult
  }

  await app.guideGenerationQueue.add(
    'generate-guide',
    { guideId: prepared.guide.id },
    createGuideJobOptions(prepared.guide.id),
  )

  return {
    ...prepared,
    enqueued: true,
  } satisfies GuideQueueResult
}

export async function processGuideGeneration(app: FastifyInstance, guideId: string) {
  const guide = await app.prisma.generatedGuide.findUnique({
    where: { id: guideId },
    include: {
      place: true,
      audioAssets: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!guide) {
    throw new Error(`Guide ${guideId} not found for processing.`)
  }

  if (guide.status === ProcessingStatus.READY) {
    return requireGuideResponse(app, guide.id)
  }

  const place = guide.place
  const input: GuideRequestInput = {
    placeId: place.id,
    language: fromGuideLanguage(guide.language),
    duration: fromGuideDuration(guide.duration),
    detailLevel: fromGuideDetailLevel(guide.detailLevel),
  }

  await app.prisma.generatedGuide.update({
    where: { id: guide.id },
    data: {
      status: ProcessingStatus.PROCESSING,
      generationAttempts: {
        increment: 1,
      },
      generationStartedAt: new Date(),
      generationCompletedAt: null,
      lastError: null,
    },
  })

  try {
    const prompt = buildGuidePrompt(place, input)
    let script: string
    let provider = 'gemini'
    let llmLatencyMs: number | null = null
    let fallbackUsed = false

    try {
      const llmResult = await generateGuideWithGemini({ prompt })
      script = llmResult.text
      llmLatencyMs = llmResult.latencyMs
    } catch (error) {
      app.log.warn({ err: error, placeId: place.id }, 'Gemini generation failed, using fallback guide script')
      script = buildFallbackGuideScript(place, input)
      provider = 'template-fallback'
      fallbackUsed = true
    }

    const scriptWordCount = script.split(/\s+/).filter(Boolean).length
    const estimatedDurationSec = Math.max(30, Math.round(scriptWordCount / 2.4))

    const speech = await synthesizeSpeechWithElevenLabs({
      text: script,
      language: input.language,
    })

    const upload = await uploadGuideAudio({
      guideId: guide.id,
      audioBuffer: speech.audioBuffer,
    })

    const latestAudio = guide.audioAssets[0]

    await app.prisma.generatedGuide.update({
      where: { id: guide.id },
      data: {
        script,
        provider,
        ttsProvider: 'elevenlabs',
        estimatedDurationSec,
        status: ProcessingStatus.READY,
        generationCompletedAt: new Date(),
        lastError: null,
        fallbackUsed,
        llmLatencyMs,
        ttsLatencyMs: speech.latencyMs,
        scriptWordCount,
      },
    })

    if (latestAudio) {
      await app.prisma.audioAsset.update({
        where: { id: latestAudio.id },
        data: {
          storageBucket: upload.bucket,
          storagePath: upload.path,
          mimeType: 'audio/mpeg',
          voiceCode: speech.voiceId,
          status: ProcessingStatus.READY,
          lastError: null,
          audioBytes: speech.audioBuffer.byteLength,
        },
      })
    } else {
      await app.prisma.audioAsset.create({
        data: {
          guideId: guide.id,
          storageBucket: upload.bucket,
          storagePath: upload.path,
          mimeType: 'audio/mpeg',
          voiceCode: speech.voiceId,
          status: ProcessingStatus.READY,
          lastError: null,
          audioBytes: speech.audioBuffer.byteLength,
        },
      })
    }

    return requireGuideResponse(app, guide.id)
  } catch (error) {
    await app.prisma.generatedGuide.update({
      where: { id: guide.id },
      data: {
        status: ProcessingStatus.FAILED,
        generationCompletedAt: new Date(),
        lastError: error instanceof Error ? error.message : 'Unknown guide generation error',
      },
    })

    if (guide.audioAssets[0]) {
      await app.prisma.audioAsset.update({
        where: { id: guide.audioAssets[0].id },
        data: {
          status: ProcessingStatus.FAILED,
          lastError: error instanceof Error ? error.message : 'Unknown audio generation error',
        },
      })
    }

    throw error
  }
}

export async function waitForGuideJob(app: FastifyInstance, guideId: string, timeoutMs = 180000) {
  const job = await app.guideGenerationQueue.getJob(guideId)

  if (!job) {
    return null
  }

  await job.waitUntilFinished(app.guideGenerationQueueEvents, timeoutMs)
  return getGuide(app, guideId)
}

export async function createGuide(app: FastifyInstance, input: GuideRequestInput): Promise<GuideQueueResult | GuideQueueError> {
  return enqueueGuideGeneration(app, input)
}

export async function getGuide(app: FastifyInstance, id: string) {
  return buildGuideResponse(app, id)
}

export async function getGuideStatus(app: FastifyInstance, id: string) {
  const guide = await app.prisma.generatedGuide.findUnique({
    where: { id },
    include: {
      audioAssets: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!guide) {
    return null
  }

  return {
    id: guide.id,
    status: fromProcessingStatus(guide.status),
    audioStatus: guide.audioAssets[0] ? fromProcessingStatus(guide.audioAssets[0].status) : 'pending',
  }
}
