import { synthesizeSpeechWithElevenLabs } from './elevenlabs.js'
import { synthesizeSpeechWithGoogleTts } from './google-tts.js'

export type TtsProviderName = 'google' | 'elevenlabs'

export type TtsSynthesisResult = {
  provider: string
  voiceId: string
  audioBuffer: Buffer
  latencyMs: number
}

function resolveTtsProvider(): TtsProviderName {
  const provider = process.env.TTS_PROVIDER || 'google'

  if (provider === 'google' || provider === 'elevenlabs') {
    return provider
  }

  throw new Error(`Unsupported TTS_PROVIDER: ${provider}`)
}

export async function synthesizeSpeech(input: { text: string; language: 'es-AR' | 'en' }): Promise<TtsSynthesisResult> {
  const provider = resolveTtsProvider()

  if (provider === 'elevenlabs') {
    const result = await synthesizeSpeechWithElevenLabs(input)
    return {
      provider: 'elevenlabs',
      ...result,
    }
  }

  return synthesizeSpeechWithGoogleTts(input)
}
