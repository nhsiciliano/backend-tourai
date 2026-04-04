import type { Place } from '@prisma/client'
import type { GuideDetailInput, GuideDurationInput, GuideLanguageInput } from './types.js'

function durationInstruction(duration: GuideDurationInput) {
  if (duration === 'short') return 'Aim for about 90 to 120 words.'
  if (duration === 'medium') return 'Aim for about 170 to 230 words.'
  return 'Aim for about 300 to 380 words.'
}

function detailInstruction(detailLevel: GuideDetailInput) {
  if (detailLevel === 'basic') return 'Keep it accessible and concise, focused on the main idea and one or two memorable facts.'
  if (detailLevel === 'standard') return 'Balance narrative clarity with useful historical and scientific context.'
  return 'Include richer historical, scientific and urban context while remaining natural for audio narration.'
}

function languageInstruction(language: GuideLanguageInput) {
  if (language === 'es-AR') {
    return 'Write in rioplatense-friendly neutral Spanish suitable for tourism audio guides in Buenos Aires.'
  }

  return 'Write in natural English for international tourists visiting Buenos Aires.'
}

export function buildGuidePrompt(place: Place, input: { language: GuideLanguageInput; duration: GuideDurationInput; detailLevel: GuideDetailInput }) {
  const summarySeed = input.language === 'es-AR' ? place.summarySeedEs : place.summarySeedEn

  return `You are writing a high-quality mobile audio guide script.

${languageInstruction(input.language)}
${durationInstruction(input.duration)}
${detailInstruction(input.detailLevel)}

Requirements:
- Write a single flowing narration, not bullets.
- Mention the place name naturally at the beginning.
- Keep a warm, trustworthy museum-audioguide tone.
- Do not invent facts beyond the supplied context.
- If the context is limited, stay precise and modest.
- Include scientific, engineering, urban, architectural or historical relevance when available.
- End with a short closing line.

Place data:
- Name (ES): ${place.nameEs}
- Name (EN): ${place.nameEn}
- City: ${place.city}
- Country: ${place.country}
- Category: ${place.category}
- Scientific relevance: ${place.scientificRelevance ?? 'Not specified'}
- Editorial context: ${summarySeed ?? 'Not specified'}

Return only the final narration text.`
}

export function buildFallbackGuideScript(place: Place, input: { language: GuideLanguageInput; duration: GuideDurationInput; detailLevel: GuideDetailInput }) {
  const placeName = input.language === 'es-AR' ? place.nameEs : place.nameEn
  const summary = input.language === 'es-AR' ? place.summarySeedEs : place.summarySeedEn
  const relevance = place.scientificRelevance

  if (input.language === 'es-AR') {
    const detailSentence =
      input.detailLevel === 'basic'
        ? 'La idea es darte una introduccion clara y breve para ubicar este sitio dentro de la ciudad.'
        : input.detailLevel === 'standard'
          ? 'Vale la pena mirarlo como una combinacion de historia urbana, identidad cultural y divulgacion publica.'
          : 'Ademas de su valor simbolico, conviene leer este lugar como una pieza dentro de la historia urbana, cultural y cientifica de Buenos Aires.'

    return `${placeName}. Estas frente a uno de los puntos mas representativos de ${place.city}. ${summary ?? `${placeName} es un lugar destacado dentro del paisaje urbano porteno.`} ${detailSentence} ${relevance ? `Su interes especial esta en ${relevance}.` : 'Su interes esta en la manera en que conecta espacio publico, memoria y experiencia de la ciudad.'} Si eliges una version mas extensa, esta guia puede profundizar en su contexto historico y su relacion con el desarrollo de Buenos Aires.`
  }

  const detailSentence =
    input.detailLevel === 'basic'
      ? 'This version gives you a clear, compact introduction so you can place the site within the city.'
      : input.detailLevel === 'standard'
        ? 'It is worth seeing it as a combination of urban history, cultural identity and public interpretation.'
        : 'Beyond its symbolic value, this site can also be understood as part of the urban, cultural and scientific history of Buenos Aires.'

  return `${placeName}. You are standing near one of the most recognizable sites in ${place.city}. ${summary ?? `${placeName} is a distinctive landmark within the cityscape of Buenos Aires.`} ${detailSentence} ${relevance ? `Its special relevance lies in ${relevance}.` : 'Its relevance comes from the way it connects public space, memory and the experience of the city.'} In a longer version, this guide can go deeper into its historical background and its role in the development of Buenos Aires.`
}
