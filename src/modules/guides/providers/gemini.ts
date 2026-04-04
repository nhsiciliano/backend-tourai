type GenerateGuideInput = {
  prompt: string
}

export async function generateGuideWithGemini(input: GenerateGuideInput): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    throw new Error(`Gemini request failed with status ${response.status}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()

  if (!text) {
    throw new Error('Gemini returned an empty guide script.')
  }

  return text
}
