import React from 'react'

export default function PointsBadge({ points }) {
  return (
    <span className="inline-flex items-center gap-1 bg-accent text-white font-semibold px-3 py-1 rounded-full text-sm">
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      {points ?? 0} taškai
    </span>
  )
}
