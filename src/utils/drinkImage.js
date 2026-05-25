export const DRINK_IMAGES = [
  { file: 'sex_otb.png', label: 'Sex on the Beach' },
  { file: 'Vodka.png', label: 'Vodka' },
  { file: 'Blue_lagoon.png', label: 'Blue Lagoon' },
  { file: 'Pornstar.png', label: 'Pornstar' },
]

const KEYWORDS = [
  { file: 'sex_otb.png', words: ['sex on', 'sex_otb', 'beach'] },
  { file: 'Vodka.png', words: ['vodka'] },
  { file: 'Blue_lagoon.png', words: ['blue lagoon', 'blue_lagoon', 'lagoon'] },
  { file: 'Pornstar.png', words: ['pornstar', 'porn star'] },
]

export function getDrinkImage(pavadinimas, pasiulymAsId) {
  const t = (pavadinimas || '').toLowerCase()
  for (const { file, words } of KEYWORDS) {
    if (words.some((w) => t.includes(w))) return file
  }
  if (pasiulymAsId) {
    const stored = localStorage.getItem(`drinkImg_${pasiulymAsId}`)
    if (stored) return stored
    return DRINK_IMAGES[Number(pasiulymAsId) % DRINK_IMAGES.length].file
  }
  return DRINK_IMAGES[0].file
}
