import React, { useState } from 'react'

const RATINGS = [
  { value: 'alien', emoji: '👽', label: 'Tinka', bonusPct: 10 },
  { value: 'thumb', emoji: '👍', label: 'Gerai', bonusPct: 20 },
  { value: 'heart', emoji: '❤️', label: 'Puiku', bonusPct: 20 },
]

export default function RatingModal({ orderId, onSubmit, onClose, title = 'Įvertinkite užsakymą', commentOnly = false, reviewedBalance = null }) {
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = commentOnly ? comment.trim().length > 0 : !!selected

  const selectedRating = RATINGS.find((r) => r.value === selected)
  const bonusAmount = selectedRating && reviewedBalance != null
    ? Math.floor(reviewedBalance * selectedRating.bonusPct / 100)
    : null

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        order_id: orderId,
        rating: commentOnly ? 'ok' : selected,
        comment: comment.trim() || undefined,
        bonus_amount: bonusAmount ?? undefined,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-[390px] p-6 pb-10">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-semibold text-center text-gray-900 mb-6">{title}</h2>

        {!commentOnly && (
          <div className="flex justify-center gap-6 mb-3">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelected(r.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors ${
                  selected === r.value ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-surface'
                }`}
              >
                <span className="text-4xl">{r.emoji}</span>
                <span className="text-xs font-medium text-primary/70">{r.label}</span>
              </button>
            ))}
          </div>
        )}

        {bonusAmount != null && bonusAmount > 0 && (
          <p className="text-center text-xs text-accent font-semibold mb-4">
            Gavėjas gaus +{bonusAmount} taškų
          </p>
        )}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={commentOnly ? 'Parašykite atsiliepimą...' : 'Komentaras (neprivalomas)'}
          rows={3}
          className="w-full border border-border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 mb-6"
        />

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full bg-primary text-white py-3 rounded-pill font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? 'Siunčiama...' : 'Išsaugoti'}
        </button>
        <button
          onClick={onClose}
          className="w-full mt-3 py-3 text-primary/60 text-sm font-medium"
        >
          Atšaukti
        </button>
      </div>
    </div>
  )
}
