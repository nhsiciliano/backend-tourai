type ElevenLabsVoice = {
  voice_id: string
  name: string
}

let voicesCache: ElevenLabsVoice[] | null = null

async function getVoices(): Promise<ElevenLabsVoice[]> {
  if (voicesCache) {
    return voicesCache
  }

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs voices request failed with status ${response.status}`)
  }

  const data = (await response.json()) as { voices?: ElevenLabsVoice[] }
  voicesCache = data.voices ?? []
  return voicesCache
}

async function resolveVoiceId(language: 'es-AR' | 'en') {
  const configuredVoiceId = language === 'es-AR' ? process.env.ELEVENLABS_VOICE_ID_ES : process.env.ELEVENLABS_VOICE_ID_EN

  if (configuredVoiceId) {
    return configuredVoiceId
  }

  const voices = await getVoices()

  if (voices.length === 0) {
    throw new Error('No ElevenLabs voices are available for the configured API key.')
  }

  return voices[0]!.voice_id
}

export async function synthesizeSpeechWithElevenLabs(input: { text: string; language: 'es-AR' | 'en' }) {
  const startedAt = Date.now()
  const voiceId = await resolveVoiceId(input.language)
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: input.text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs synthesis failed with status ${response.status}: ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  return {
    voiceId,
    audioBuffer: Buffer.from(arrayBuffer),
    latencyMs: Date.now() - startedAt,
  }
}
