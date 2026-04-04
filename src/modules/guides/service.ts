import { createHash } from 'node:crypto'
import { ProcessingStatus } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { getPlaceById } from '../places/service.js'
import { fromGuideDetailLevel, fromGuideDuration, fromGuideLanguage, fromProcessingStatus, toGuideDetailLevel, toGuideDuration, toGuideLanguage } from './mappers.js'
import { buildFallbackGuideScript, buildGuidePrompt } from './prompt.js'
import { synthesizeSpeechWithElevenLabs } from './providers/elevenlabs.js'
import { generateGuideWithGemini } from './providers/gemini.js'
import { createGuideAudioSignedUrl, uploadGuideAudio } from './storage.js'
import type { GuideRequestInput } from './types.js'

const PROMPT_VERSION = 'v1'

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

export async function createGuide(app: FastifyInstance, input: GuideRequestInput) {
  const place = await app.prisma.place.findFirst({
    where: {
      OR: [{ id: input.placeId }, { slug: input.placeId }],
    },
  })

  if (!place) {
    return { error: 'PLACE_NOT_FOUND' as const }
  }

  const inputHash = buildInputHash({ ...input, placeId: place.id })
  const existing = await app.prisma.generatedGuide.findUnique({ where: { inputHash } })

  if (existing && existing.status !== ProcessingStatus.FAILED) {
    return {
      guide: await requireGuideResponse(app, existing.id),
      cached: true,
    }
  }

  const createdGuide = existing
    ? await app.prisma.generatedGuide.update({
        where: { id: existing.id },
        data: {
          script: null,
          provider: null,
          estimatedDurationSec: null,
          status: ProcessingStatus.PROCESSING,
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
          status: ProcessingStatus.PROCESSING,
        },
      })

  try {
    const prompt = buildGuidePrompt(place, input)
    let script: string
    let provider = 'gemini'

    try {
      script = await generateGuideWithGemini({ prompt })
    } catch (error) {
      app.log.warn({ err: error, placeId: place.id }, 'Gemini generation failed, using fallback guide script')
      script = buildFallbackGuideScript(place, input)
      provider = 'template-fallback'
    }

    const estimatedDurationSec = Math.max(30, Math.round(script.split(/\s+/).length / 2.4))

    const speech = await synthesizeSpeechWithElevenLabs({
      text: script,
      language: input.language,
    })

    const upload = await uploadGuideAudio({
      guideId: createdGuide.id,
      audioBuffer: speech.audioBuffer,
    })

    await app.prisma.generatedGuide.update({
      where: { id: createdGuide.id },
      data: {
        script,
        provider,
        estimatedDurationSec,
        status: ProcessingStatus.READY,
      },
    })

    await app.prisma.audioAsset.create({
      data: {
        guideId: createdGuide.id,
        storageBucket: upload.bucket,
        storagePath: upload.path,
        mimeType: 'audio/mpeg',
        voiceCode: speech.voiceId,
        status: ProcessingStatus.READY,
      },
    })

    return {
      guide: await requireGuideResponse(app, createdGuide.id),
      cached: false,
    }
  } catch (error) {
    await app.prisma.generatedGuide.update({
      where: { id: createdGuide.id },
      data: {
        status: ProcessingStatus.FAILED,
      },
    })

    throw error
  }
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
