import { GoogleAuth } from 'google-auth-library'

type GoogleServiceAccount = {
  client_email: string
  private_key: string
  project_id?: string
}

type GoogleTtsResponse = {
  audioContent?: string
}

function getGoogleCredentials(): GoogleServiceAccount {
  const encodedCredentials = process.env.GOOGLE_CLOUD_TTS_CREDENTIALS_BASE64

  if (!encodedCredentials) {
    throw new Error('GOOGLE_CLOUD_TTS_CREDENTIALS_BASE64 is required when TTS_PROVIDER=google.')
  }

  const rawCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf8')
  return JSON.parse(rawCredentials) as GoogleServiceAccount
}

async function getAccessToken() {
  const credentials = getGoogleCredentials()
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()

  if (!token.token) {
    throw new Error('Google Cloud TTS access token could not be resolved.')
  }

  return token.token
}

function resolveVoice(input: { language: 'es-AR' | 'en' }) {
  if (input.language === 'es-AR') {
    return {
      languageCode: process.env.GOOGLE_TTS_LANGUAGE_CODE_ES || 'es-US',
      voiceName: process.env.GOOGLE_TTS_VOICE_ES || 'es-US-Neural2-A',
    }
  }

  return {
    languageCode: process.env.GOOGLE_TTS_LANGUAGE_CODE_EN || 'en-US',
    voiceName: process.env.GOOGLE_TTS_VOICE_EN || 'en-US-Neural2-D',
  }
}

export async function synthesizeSpeechWithGoogleTts(input: { text: string; language: 'es-AR' | 'en' }) {
  const startedAt = Date.now()
  const accessToken = await getAccessToken()
  const voice = resolveVoice({ language: input.language })

  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        text: input.text,
      },
      voice: {
        languageCode: voice.languageCode,
        name: voice.voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Cloud TTS synthesis failed with status ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as GoogleTtsResponse

  if (!data.audioContent) {
    throw new Error('Google Cloud TTS returned an empty audio payload.')
  }

  return {
    provider: 'google-cloud-tts',
    voiceId: voice.voiceName,
    audioBuffer: Buffer.from(data.audioContent, 'base64'),
    latencyMs: Date.now() - startedAt,
  }
}
