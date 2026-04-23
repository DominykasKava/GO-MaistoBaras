import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const BG = 'linear-gradient(145deg, #1565C0 0%, #E65100 55%, #B71C1C 100%)'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    // FAKE login (kaip senam kode)
    setTimeout(() => {
      setLoading(false)
      alert('Prisijungta (test)')
      navigate('/')
    }, 500)
  }

  return (
    <div className="app-shell screen-content-no-nav flex flex-col" style={{ background: BG }}>
      <div className="flex-1 flex flex-col justify-center px-6 py-12">

        {/* Logo */}
        <div className="mb-10 text-center">
          {!logoError ? (
            <div className="bg-white rounded-3xl p-4 inline-block mb-5 shadow-2xl">
              <img
                src="/logo.png"
                alt="GO MaistoBaras"
                className="w-24 h-24 object-contain"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-3xl inline-flex items-center justify-center mb-5 bg-white/20 backdrop-blur-sm">
              <span className="text-5xl font-black text-white">G</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-black tracking-tight text-white drop-shadow">GO</span>
            <div className="flex flex-col leading-none ml-1">
              <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow">Maisto</span>
              <span className="text-xs font-bold text-white/80 uppercase tracking-widest drop-shadow">Baras</span>
            </div>
          </div>

          <p className="text-white/70 text-sm mt-2">Prisijunkite prie paskyros</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              El. paštas
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="jonas@example.com"
              className="w-full bg-white/90 rounded-pill px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 border-0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              Slaptažodis
            </label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-white/90 rounded-pill px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 border-0"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white text-primary py-3.5 rounded-pill font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-colors shadow-lg"
          >
            {loading ? 'Prisijungiama...' : 'Prisijungti'}
          </button>
        </form>

        <p className="text-center text-sm text-white/70 mt-6">
          Neturite paskyros?{' '}
          <Link to="/register" className="text-white font-bold underline underline-offset-2">
            Registruotis
          </Link>
        </p>
      </div>
    </div>
  )
}