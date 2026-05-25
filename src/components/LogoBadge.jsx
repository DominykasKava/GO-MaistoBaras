import React, { useState } from 'react'

function FallbackSVG({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgGrad" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1565C0" />
          <stop offset="0.55" stopColor="#E65100" />
          <stop offset="1" stopColor="#B71C1C" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="22" fill="url(#lgGrad)" />
      <line x1="30" y1="44" x2="30" y2="76" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="22" y1="20" x2="22" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="20" x2="30" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="38" y1="20" x2="38" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M22 40 Q26 46 30 44 Q34 46 38 40" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M60 52 C60 40 76 34 76 34 C76 34 78 50 66 56 L66 76" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M66 62 C58 60 54 66 54 72" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function LogoBadge({ size = 96 }) {
  const [imgError, setImgError] = useState(false)

  if (!imgError) {
    return (
      <img
        src="/logo.png"
        alt="GO MaistoBaras"
        width={size}
        height={size}
        style={{ borderRadius: 22, objectFit: 'contain', display: 'block' }}
        onError={() => setImgError(true)}
      />
    )
  }

  return <FallbackSVG size={size} />
}
