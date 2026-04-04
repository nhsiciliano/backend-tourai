export type GuideLanguageInput = 'es-AR' | 'en'
export type GuideDurationInput = 'short' | 'medium' | 'long'
export type GuideDetailInput = 'basic' | 'standard' | 'deep'

export type GuideRequestInput = {
  placeId: string
  language: GuideLanguageInput
  duration: GuideDurationInput
  detailLevel: GuideDetailInput
}
