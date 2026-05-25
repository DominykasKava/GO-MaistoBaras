import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { getLeaderboard } from '../api/points'

const ROLE_TABS = [
  { value: 'all', label: 'Visi' },
  { value: 'davejas', label: 'Davėjai' },
  { value: 'gavejas', label: 'Gavėjai' },
  { value: 'transportuotojas', label: 'Transport.' },
]

function Avatar({ name, rank }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const rankColors = ['bg-accent', 'bg-border', 'bg-danger']
  const bg = rank <= 3 ? rankColors[rank - 1] : 'bg-primary'
  return (
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <span className="text-white text-sm font-bold">{initials}</span>
    </div>
  )
}

export default function LeaderboardScreen() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    getLeaderboard()
      .then((d) => setData(d?.leaderboard ?? d ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tab === 'all' ? data : data.filter((u) => u.role === tab)

  return (
    <div>
      <TopBar title="Lyderių lentelė" showBack />
      <div className="screen-content">
        {/* Role tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          {ROLE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                tab === t.value
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-4 py-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Kraunama...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <span className="text-4xl block mb-2">🏆</span>
              <p className="text-sm">Duomenų nėra</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((u, i) => (
                <div
                  key={u.id ?? i}
                  className={`flex items-center gap-3 p-3 rounded-2xl ${
                    i === 0 ? 'bg-accent/10 border border-accent/30' : 'bg-surface'
                  }`}
                >
                  <span className="w-6 text-center text-sm font-bold text-gray-400">
                    {i + 1}
                  </span>
                  <Avatar name={u.name} rank={i + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                  </div>
                  <span className="text-accent font-bold text-sm">{u.points ?? 0} t.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
