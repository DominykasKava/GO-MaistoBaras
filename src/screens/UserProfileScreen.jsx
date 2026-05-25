import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import PointsBadge from '../components/PointsBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getUserProfile } from '../api/users'
import { getBalance, sendPoints } from '../api/points'

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

function SendPointsModal({ profile, myBalance, onClose, onSent }) {
  const showToast = useToast()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const amt = parseInt(amount, 10)
  const valid = amt >= 1 && amt <= (myBalance ?? 0)

  const handleSend = async () => {
    if (!valid) return
    setLoading(true)
    try {
      await sendPoints(profile.id, amt)
      showToast(`${amt} taškai išsiusti ${profile.name}!`, 'success')
      onSent(amt)
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-[390px] p-6 pb-10">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-semibold text-center text-gray-900 mb-1">
          Siusti taškus
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Gavėjas: <span className="font-medium text-gray-700">{profile.name}</span>
        </p>

        <div className="bg-primary/10 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-sm text-gray-600">Mano likutis</span>
          <span className="font-bold text-primary">⭐ {myBalance ?? 0} taškai</span>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Taškų kiekis
          </label>
          <input
            type="number"
            min={1}
            max={myBalance ?? 0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="pvz. 10"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50"
          />
          {amount && !valid && (
            <p className="text-xs text-danger mt-1.5">
              {amt < 1 ? 'Mažiausiai 1 taškas' : 'Nepakanka taškų'}
            </p>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!valid || loading}
          className="w-full bg-primary text-white py-3 rounded-pill font-semibold disabled:opacity-50 transition-opacity mb-3"
        >
          {loading ? 'Siunčiama...' : `Siusti ${valid ? amt : ''} taškus`}
        </button>
        <button onClick={onClose} className="w-full py-3 text-gray-500 text-sm font-medium">
          Atšaukti
        </button>
      </div>
    </div>
  )
}

export default function UserProfileScreen() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myBalance, setMyBalance] = useState(null)
  const [showSend, setShowSend] = useState(false)

  useEffect(() => {
    getUserProfile(id)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (currentUser?.role === 'gavejas') {
      getBalance().then((b) => setMyBalance(b?.balance ?? b?.points ?? b)).catch(() => {})
    }
  }, [currentUser?.role])

  const canSend = currentUser?.role === 'gavejas' && profile && String(currentUser.id) !== String(id)

  if (loading) {
    return (
      <div>
        <TopBar title="Profilis" showBack />
        <div className="screen-content flex items-center justify-center">
          <p className="text-gray-400">Kraunama...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div>
        <TopBar title="Profilis" showBack />
        <div className="screen-content flex items-center justify-center">
          <p className="text-gray-400">Vartotojas nerastas</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Vartotojo profilis" showBack />
      <div className="screen-content px-4 py-6">
        <div className="flex flex-col items-center gap-3 mb-6">
          <Avatar name={profile.name} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <span className="inline-block mt-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>
          <PointsBadge points={profile.points_balance} />
          {profile.address && (
            <div className="bg-primary/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-base">📍</span>
              <p className="text-sm text-gray-700">{profile.address}</p>
            </div>
          )}
        </div>

        {canSend && (
          <button
            onClick={() => setShowSend(true)}
            className="w-full bg-primary text-white py-3.5 rounded-pill font-semibold shadow-md active:bg-primary-dark transition-colors mb-6 flex items-center justify-center gap-2"
          >
            ⭐ Siusti taškus
          </button>
        )}

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">
            Atsiliepimai ({profile.feedback?.length ?? 0})
          </h3>
          {!profile.feedback?.length ? (
            <p className="text-sm text-gray-400 text-center py-4">Atsiliepimų dar nėra</p>
          ) : (
            <div className="flex flex-col gap-2">
              {profile.feedback.map((f, i) => (
                <div key={i} className="bg-surface rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{RATING_EMOJI[f.rating] ?? '⭐'}</span>
                    <div className="flex-1">
                      {f.comment && <p className="text-sm text-gray-600">{f.comment}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{f.from_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSend && (
        <SendPointsModal
          profile={profile}
          myBalance={myBalance}
          onClose={() => setShowSend(false)}
          onSent={(amt) => setMyBalance((b) => (b ?? 0) - amt)}
        />
      )}
    </div>
  )
}
