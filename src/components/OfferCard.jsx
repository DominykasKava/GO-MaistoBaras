import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getOfferImage } from '../utils/offerImage'

function formatExpiry(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('lt-LT', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OfferCard({ offer }) {
  const navigate = useNavigate()
  const image = getOfferImage(offer.title, offer.id)

  return (
    <div
      onClick={() => navigate(`/pasiulymai/${offer.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-border cursor-pointer active:bg-surface transition-colors overflow-hidden"
    >
      {image && (
        <img src={`/${image}`} alt={offer.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{offer.title}</h3>
          {offer.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{offer.description}</p>
          )}
        </div>
        {offer.distance != null && (
          <span className="shrink-0 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
            {offer.distance < 1
              ? `${Math.round(offer.distance * 1000)} m`
              : `${offer.distance.toFixed(1)} km`}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 gap-2">
        {offer.expires_at && (
          <p className="text-xs text-gray-400">
            Galioja iki: {formatExpiry(offer.expires_at)}
          </p>
        )}
        {offer.transporter_points != null && (
          <span className="shrink-0 inline-flex items-center gap-0.5 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
            ⭐ {offer.transporter_points} t.
          </span>
        )}
      </div>
      </div>
    </div>
  )
}
