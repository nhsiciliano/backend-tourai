import { GuideDetailLevel, GuideDuration, GuideLanguage, ProcessingStatus } from '@prisma/client'
import type { GuideDetailInput, GuideDurationInput, GuideLanguageInput } from './types.js'

export function toGuideLanguage(value: GuideLanguageInput): GuideLanguage {
  return value === 'es-AR' ? GuideLanguage.ES_AR : GuideLanguage.EN
}

export function toGuideDuration(value: GuideDurationInput): GuideDuration {
  if (value === 'short') return GuideDuration.SHORT
  if (value === 'medium') return GuideDuration.MEDIUM
  return GuideDuration.LONG
}

export function toGuideDetailLevel(value: GuideDetailInput): GuideDetailLevel {
  if (value === 'basic') return GuideDetailLevel.BASIC
  if (value === 'standard') return GuideDetailLevel.STANDARD
  return GuideDetailLevel.DEEP
}

export function fromProcessingStatus(status: ProcessingStatus): 'pending' | 'processing' | 'ready' | 'failed' {
  if (status === ProcessingStatus.PENDING) return 'pending'
  if (status === ProcessingStatus.PROCESSING) return 'processing'
  if (status === ProcessingStatus.READY) return 'ready'
  return 'failed'
}

export function fromGuideLanguage(value: GuideLanguage): GuideLanguageInput {
  return value === GuideLanguage.ES_AR ? 'es-AR' : 'en'
}

export function fromGuideDuration(value: GuideDuration): GuideDurationInput {
  if (value === GuideDuration.SHORT) return 'short'
  if (value === GuideDuration.MEDIUM) return 'medium'
  return 'long'
}

export function fromGuideDetailLevel(value: GuideDetailLevel): GuideDetailInput {
  if (value === GuideDetailLevel.BASIC) return 'basic'
  if (value === GuideDetailLevel.STANDARD) return 'standard'
  return 'deep'
}
