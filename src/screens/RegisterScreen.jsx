import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const BG = 'linear-gradient(145deg, #1565C0 0%, #E65100 55%, #B71C1C 100%)'

const ROLES = [
  {
    value: 'gavejas',
    label: 'Gavėjas',
    desc: 'Gaunu maistą',
    bg: 'linear-gradient(135deg, #1976D2, #1565C0)',
  },
  {
    value: 'restoranas',
    label: 'Restoranas',
    desc: 'Dalinuosi maistu',
    bg: 'linear-gradient(135deg, #FF6F00, #E65100)',
  },
  {
    value: 'transportuotojas',
    label: 'Transportuotojas',
    desc: 'Pristatau maistą',
    bg: 'linear-gradient(135deg, #D32F2F, #B71C1C)',
  },
]

export default function RegisterScreen() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'gavejas',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      alert('Registracija išsiųsta')
      navigate('/login')
    }, 500)
  }

  return (
    <div className="app-shell screen-content-no-nav flex flex-col" style={{ background: BG }}>
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-3xl font-black tracking-tight text-white drop-shadow">GO</span>
            <div className="flex flex-col leading-none ml-1">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow">Maisto</span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest drop-shadow">Baras</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mt-3">Sukurti paskyrą</h2>
          <p className="text-white/70 text-sm mt-1">Prisijunkite prie bendruomenės</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              Vardas
            </label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Jonas Jonaitis"
              className="w-full bg-white/90 rounded-pill px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 border-0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              El. paštas
            </label>
            <input
              name="email"
              type="email"
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
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-white/90 rounded-pill px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 border-0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              Rolė
            </label>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => {
                const active = form.role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    style={active ? { background: r.bg } : {}}
                    className={`flex items-center gap-4 w-full px-4 py-3 rounded-2xl border-2 transition-all ${
                      active ? 'border-transparent' : 'bg-white/20 border-white/30'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        active ? 'border-white bg-white' : 'border-white/60'
                      }`}
                    >
                      {active && <div className="w-2 h-2 rounded-full bg-gray-700" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{r.label}</p>
                      <p className="text-xs text-white/70 mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white text-primary py-3.5 rounded-pill font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-colors shadow-lg"
          >
            {loading ? 'Registruojama...' : 'Registruotis'}
          </button>
        </form>

        <p className="text-center text-sm text-white/70 mt-6">
          Jau turite paskyrą?{' '}
          <Link to="/login" className="text-white font-bold underline underline-offset-2">
            Prisijungti
          </Link>
        </p>
      </div>
    </div>
  )
}