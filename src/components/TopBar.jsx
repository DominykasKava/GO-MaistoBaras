import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, showBack = false, actions, menuItems }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [menuOpen])

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-14 bg-primary text-white flex items-center px-2 z-40 shadow-md">
      {showBack ? (
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors mr-1"
          aria-label="Grįžti"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
      ) : (
        <div className="w-8" />
      )}
      <h1 className="flex-1 text-center text-lg font-medium tracking-wide truncate">
        {title}
      </h1>
      <div className="flex justify-end gap-0.5">
        {actions}
        {menuItems?.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Meniu"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-[170px] py-1 z-50 overflow-hidden">
                {menuItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { setMenuOpen(false); item.onClick() }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors active:bg-gray-50 ${
                      item.danger ? 'text-danger' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
