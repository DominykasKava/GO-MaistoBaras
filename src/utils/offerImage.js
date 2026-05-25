export const OFFER_IMAGES = [
  { file: 'Kebabas.png', label: 'Kebabas' },
  { file: 'Barsciu_Sriuba.png', label: 'Barščių sriuba' },
  { file: 'Cepelinai.png', label: 'Cepelinai' },
  { file: 'Karbonadas.png', label: 'Karbonadas' },
  { file: 'Saslykai.png', label: 'Šašlykai' },
]

const KEYWORDS = [
  { file: 'Kebabas.png', words: ['kebab'] },
  { file: 'Barsciu_Sriuba.png', words: ['barš', 'barsc', 'sriub'] },
  { file: 'Cepelinai.png', words: ['cepelin', 'didžkukul', 'didzkukul'] },
  { file: 'Karbonadas.png', words: ['karbonadas', 'karbonado'] },
  { file: 'Saslykai.png', words: ['šašlyk', 'sasly'] },
]

export function getOfferImage(title, offerId) {
  const t = (title || '').toLowerCase()
  for (const { file, words } of KEYWORDS) {
    if (words.some((w) => t.includes(w))) return file
  }
  if (offerId) {
    const stored = localStorage.getItem(`offerImg_${offerId}`)
    if (stored) return stored
    return OFFER_IMAGES[Number(offerId) % OFFER_IMAGES.length].file
  }
  return null
}
