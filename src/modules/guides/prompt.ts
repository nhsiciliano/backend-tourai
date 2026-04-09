import type { Place } from '@prisma/client'
import type { GuideDetailInput, GuideDurationInput, GuideLanguageInput } from './types.js'

function categoryInstruction(category: Place['category']) {
  switch (category) {
    case 'MONUMENT':
      return 'Focus on symbolism, city identity, visual form and why the monument became memorable.'
    case 'PLAZA':
      return 'Focus on public life, urban context, surrounding landmarks and how people experience the space.'
    case 'RUIN':
      return 'Focus on what survives, what was lost, and what the remains reveal about earlier periods.'
    case 'SCIENTIFIC_SITE':
      return 'Focus on science, engineering, astronomy, natural history or public knowledge depending on the place.'
    case 'HISTORIC_SITE':
      return 'Focus on historical significance, institutional change and the site’s role in Buenos Aires history.'
    default:
      return 'Focus on the place’s strongest historical, scientific and urban relevance.'
  }
}

function openingInstruction(language: GuideLanguageInput, category: Place['category']) {
  if (language === 'es-AR') {
    if (category === 'SCIENTIFIC_SITE') return 'Open by orienting the listener and naming the scientific or educational value of the site.'
    if (category === 'PLAZA') return 'Open by situating the listener in the urban scene and what is visible around them.'
    return 'Open by naming the site and giving an immediate sense of why it matters.'
  }

  if (category === 'SCIENTIFIC_SITE') return 'Open by orienting the listener and naming the site’s scientific or educational value.'
  if (category === 'PLAZA') return 'Open by placing the listener in the urban scene and what can be seen around them.'
  return 'Open by naming the site and giving an immediate sense of why it matters.'
}

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
${categoryInstruction(place.category)}
${openingInstruction(input.language, place.category)}

Requirements:
- Write a single flowing narration, not bullets.
- Mention the place name naturally at the beginning.
- Keep a warm, trustworthy museum-audioguide tone.
- Do not invent facts beyond the supplied context.
- If the context is limited, stay precise and modest.
- Include scientific, engineering, urban, architectural or historical relevance when available.
- End with a short closing line.
- Avoid filler phrases and generic tourism slogans.
- Prefer concrete observation over vague praise.

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
  const shortMode = input.duration === 'short'
  const longMode = input.duration === 'long'

  if (input.language === 'es-AR') {
    const categorySentence =
      place.category === 'SCIENTIFIC_SITE'
        ? 'Su valor esta en la manera en que acerca la ciencia al espacio publico y a la experiencia cotidiana de la ciudad.'
        : place.category === 'PLAZA'
          ? 'Tambien funciona como una escena urbana donde historia, circulacion y memoria colectiva se cruzan.'
          : place.category === 'HISTORIC_SITE'
            ? 'Ayuda a leer procesos politicos, culturales e institucionales que marcaron a Buenos Aires.'
            : 'Su forma, su ubicacion y su permanencia ayudan a entender como la ciudad construye sus referencias simbolicas.'

    const detailSentence =
      input.detailLevel === 'basic'
        ? 'La idea es darte una introduccion clara y breve para ubicar este sitio dentro de la ciudad.'
      : input.detailLevel === 'standard'
          ? 'Vale la pena mirarlo como una combinacion de historia urbana, identidad cultural y divulgacion publica.'
          : 'Ademas de su valor simbolico, conviene leer este lugar como una pieza dentro de la historia urbana, cultural y cientifica de Buenos Aires.'

    const closing = shortMode
      ? 'En pocos minutos, este lugar resume una parte importante del caracter de Buenos Aires.'
      : longMode
        ? 'Mirado con tiempo, permite enlazar arquitectura, ciencia, historia urbana y modos de habitar la ciudad.'
        : 'Incluso en una visita breve, alcanza para entender por que sigue siendo una referencia de la ciudad.'

    return `${placeName}. Estas frente a uno de los puntos mas representativos de ${place.city}. ${summary ?? `${placeName} es un lugar destacado dentro del paisaje urbano porteno.`} ${detailSentence} ${categorySentence} ${relevance ? `Su interes especial aparece en ${relevance}.` : 'Su interes esta en la manera en que conecta espacio publico, memoria y experiencia urbana.'} ${closing}`
  }

  const categorySentence =
    place.category === 'SCIENTIFIC_SITE'
      ? 'Its importance lies in the way it brings science into public space and everyday city life.'
      : place.category === 'PLAZA'
        ? 'It also works as an urban stage where history, movement and collective memory meet.'
        : place.category === 'HISTORIC_SITE'
          ? 'It helps explain political, cultural and institutional changes that shaped Buenos Aires.'
          : 'Its form, location and permanence help explain how the city builds its symbolic landmarks.'

  const detailSentence =
    input.detailLevel === 'basic'
      ? 'This version gives you a clear, compact introduction so you can place the site within the city.'
      : input.detailLevel === 'standard'
        ? 'It is worth seeing it as a combination of urban history, cultural identity and public interpretation.'
        : 'Beyond its symbolic value, this site can also be understood as part of the urban, cultural and scientific history of Buenos Aires.'

  const closing = shortMode
    ? 'Even in a short stop, it offers a sharp glimpse into the character of Buenos Aires.'
    : longMode
      ? 'Given more time, it opens a wider story about architecture, science, urban history and civic identity.'
      : 'Even in a brief visit, it helps explain why this site remains part of the city’s mental map.'

  return `${placeName}. You are standing near one of the most recognizable places in ${place.city}. ${summary ?? `${placeName} is a distinctive landmark within the Buenos Aires cityscape.`} ${detailSentence} ${categorySentence} ${relevance ? `Its special relevance lies in ${relevance}.` : 'Its relevance comes from the way it connects public space, memory and the experience of the city.'} ${closing}`
}
