import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchUsers } from '../api/users'

const ROLE_LABELS = {
  restoranas: 'Restoranas',
  davejas: 'Davėjas',
  gavejas: 'Gavėjas',
  transportuotojas: 'Transportuotojas',
}

const ROLE_COLORS = {
  restoranas: 'bg-primary',
  davejas: 'bg-primary',
  gavejas: 'bg-accent',
  transportuotojas: 'bg-danger',
}

export default function UserSearchModal({ onClose }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (q.length === 1) { setResults([]); return }
    setSearching(true)
    const delay = q.length === 0 ? 0 : 400
    const t = setTimeout(() => {
      searchUsers(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, delay)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-[390px] p-5 pb-10">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ieškoti vartotojų</h2>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Įveskite vardą..."
          className="w-full border border-gray-200 rounded-pill px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3" />
        {searching && <p className="text-xs text-gray-400 text-center py-2">Ieškoma...</p>}
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {results.map((u) => (
            <button key={u.id}
              onClick={() => { onClose(); navigate(`/profilis/${u.id}`) }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 active:bg-gray-100 text-left">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ROLE_COLORS[u.role] ?? 'bg-primary'}`}>
                <span className="text-white text-xs font-bold">
                  {u.name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[u.role] ?? u.role}</p>
              </div>
            </button>
          ))}
          {!searching && q.length >= 2 && results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nieko nerasta</p>
          )}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 text-gray-500 text-sm font-medium">
          Uždaryti
        </button>
      </div>
    </div>
  )
}
