import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getOffer } from '../api/offers'
import { placeOrder } from '../api/orders'
import useGeolocation from '../hooks/useGeolocation'

function formatDate(str) {
  if (!str) return null
  return new Date(str).toLocaleString('lt-LT')
}

export default function OfferDetailScreen() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const { lat: myLat, lng: myLng } = useGeolocation()

  useEffect(() => {
    getOffer(id)
      .then(setOffer)
      .catch(() => showToast('Pasiūlymo nepavyko užkrauti', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleOrder = async () => {
    setOrdering(true)
    try {
      await placeOrder({ offer_id: id, delivery_lat: myLat ?? undefined, delivery_lng: myLng ?? undefined })
      showToast('Užsakymas pateiktas!', 'success')
      navigate('/uzsakymai')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida pateikiant užsakymą', 'error')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Pasiūlymas" showBack />
        <div className="screen-content flex items-center justify-center">
          <p className="text-gray-400">Kraunama...</p>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div>
        <TopBar title="Pasiūlymas" showBack />
        <div className="screen-content flex items-center justify-center">
          <p className="text-gray-400">Pasiūlymas nerastas</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Pasiūlymas" showBack />
      <div className="screen-content px-4 py-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{offer.title}</h2>
          {offer.description && (
            <p className="text-gray-600 mt-2 text-sm leading-relaxed">{offer.description}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {offer.quantity && (
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-xs text-gray-400">Kiekis</p>
                <p className="font-semibold text-gray-800 mt-0.5">{offer.quantity}</p>
              </div>
            )}
            {offer.expires_at && (
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-xs text-gray-400">Galioja iki</p>
                <p className="font-semibold text-gray-800 mt-0.5 text-sm">{formatDate(offer.expires_at)}</p>
              </div>
            )}
            {offer.address && (
              <div className="bg-primary/10 rounded-2xl p-3 col-span-2">
                <p className="text-xs text-gray-400">📍 Adresas</p>
                <p className="font-medium text-gray-800 mt-0.5 text-sm">{offer.address}</p>
              </div>
            )}
            {offer.transporter_points != null && (
              <div className="bg-accent/10 rounded-2xl p-3 col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Transportuotojo atlygis</p>
                  <p className="font-bold text-accent mt-0.5">⭐ {offer.transporter_points} taškai</p>
                </div>
                <span className="text-2xl">🚚</span>
              </div>
            )}
            {offer.pickup_instructions && (
              <div className="bg-gray-50 rounded-2xl p-3 col-span-2">
                <p className="text-xs text-gray-400">Paėmimo instrukcijos</p>
                <p className="font-medium text-gray-800 mt-0.5 text-sm">{offer.pickup_instructions}</p>
              </div>
            )}
          </div>
        </div>

        {user?.role === 'gavejas' && (
          <button
            onClick={handleOrder}
            disabled={ordering}
            className="w-full bg-primary text-white py-4 rounded-pill font-semibold text-base shadow-md disabled:opacity-60 active:bg-primary-dark transition-colors"
          >
            {ordering ? 'Pateikiama...' : '🛒 Užsakyti'}
          </button>
        )}
      </div>
    </div>
  )
}
