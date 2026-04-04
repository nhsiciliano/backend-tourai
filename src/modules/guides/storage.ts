import { getSupabaseAdminClient } from '../../lib/supabase.js'

const AUDIO_BUCKET = 'audio-guides'

export async function uploadGuideAudio(input: { guideId: string; audioBuffer: Buffer }) {
  const supabase = getSupabaseAdminClient()
  const path = `guides/${input.guideId}/guide.mp3`

  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(path, input.audioBuffer, {
    contentType: 'audio/mpeg',
    upsert: true,
  })

  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`)
  }

  return {
    bucket: AUDIO_BUCKET,
    path,
  }
}

export async function createGuideAudioSignedUrl(path: string) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(path, 60 * 60)

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'Unknown error'}`)
  }

  return data.signedUrl
}
