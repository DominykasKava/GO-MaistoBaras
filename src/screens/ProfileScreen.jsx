import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import PointsBadge from '../components/PointsBadge'
import UserSearchModal from '../components/UserSearchModal'
import { useAuth } from '../context/AuthContext'
import { getBalance } from '../api/points'
import { getUserFeedback } from '../api/feedback'
import useAppMenu from '../hooks/useAppMenu'

const ROLE_LABELS = {
  restoranas: 'Restoranas',
  davejas: 'Davėjas',
  gavejas: 'Gavėjas',
  transportuotojas: 'Transportuotojas',
}

const RATING_EMOJI = { heart: '❤️', thumb: '👍', ok: '✅', alien: '👽' }

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-md">
      <span className="text-white text-2xl font-bold">{initials}</span>
    </div>
  )
}

export default function ProfileScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [points, setPoints] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [showSearch, setShowSearch] = useState(false)

  const menuItems = useAppMenu(() => setShowSearch(true))

  useEffect(() => {
    if (!user?.id) return
    Promise.all([getBalance(), getUserFeedback(user.id)])
      .then(([p, f]) => {
        setPoints(p?.balance ?? p?.points ?? p)
        setFeedback(f?.feedback ?? f ?? [])
      })
      .catch(() => {})
  }, [user?.id])

  return (
    <div>
      <TopBar title="Profilis" menuItems={menuItems} />
      <div className="screen-content px-4 py-6">
        <div className="flex flex-col items-center gap-3 mb-6">
          <Avatar name={user?.name} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              {ROLE_LABELS[user?.role] ?? user?.role}
            </span>
          </div>
          {user?.role !== 'restoranas' && <PointsBadge points={points} />}
          {user?.role === 'gavejas' && user?.address && (
            <div className="bg-primary/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 mt-1">
              <span className="text-base">📍</span>
              <p className="text-sm text-gray-700">{user.address}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <button onClick={() => navigate('/profilis/redaguoti')}
            className="w-full bg-gray-50 rounded-2xl py-3.5 px-4 text-left text-sm font-medium text-gray-700 flex items-center justify-between active:bg-gray-100 transition-colors">
            <span>✏️ Redaguoti profilį</span>
            <span className="text-gray-400">›</span>
          </button>
          <button onClick={() => navigate('/profilis/lyderiai')}
            className="w-full bg-gray-50 rounded-2xl py-3.5 px-4 text-left text-sm font-medium text-gray-700 flex items-center justify-between active:bg-gray-100 transition-colors">
            <span>🏆 Lyderių lentelė</span>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Atsiliepimai ({feedback.length})</h3>
          {feedback.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Atsiliepimų dar nėra</p>
          ) : (
            <div className="flex flex-col gap-2">
              {feedback.map((f, i) => (
                <div key={i} className="bg-surface rounded-2xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{RATING_EMOJI[f.rating] ?? '⭐'}</span>
                  <div>
                    {f.comment && <p className="text-sm text-gray-600">{f.comment}</p>}
                    {f.from_name && <p className="text-xs text-gray-400">{f.from_name}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}
