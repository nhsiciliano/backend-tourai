type GenerateGuideInput = {
  prompt: string
}

type GenerateGuideResult = {
  text: string
  latencyMs: number
}

export async function generateGuideWithGemini(input: GenerateGuideInput): Promise<GenerateGuideResult> {
  const startedAt = Date.now()
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: input.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini request failed for model ${model} with status ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()

  if (!text) {
    throw new Error('Gemini returned an empty guide script.')
  }

  const latencyMs = Date.now() - startedAt

  return { text, latencyMs }
}
