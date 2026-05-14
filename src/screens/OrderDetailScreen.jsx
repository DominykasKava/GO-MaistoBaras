import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { StatusBadge } from '../components/OrderCard'
import RatingModal from '../components/RatingModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getOrder, confirmOrder, confirmDelivery, declineOrder } from '../api/orders'
import { submitFeedback } from '../api/feedback'
import { getBalance } from '../api/points'

const STATUS_STEPS = ['laukiama_patvirtinimo', 'laukiama', 'pristatoma', 'ivykdyta']

function Timeline({ currentStatus }) {
  const labels = {
    laukiama_patvirtinimo: 'Laukia restorano patvirtinimo',
    laukiama: 'Laukiama transportuotojo',
    pristatoma: 'Pristatoma',
    ivykdyta: 'Įvykdyta',
  }
  const cancelled = currentStatus === 'atsaukta' || currentStatus === 'atmesta'
  const currentIdx = STATUS_STEPS.indexOf(currentStatus)

  if (cancelled) {
    return (
      <div className="mt-4 flex items-center gap-2 text-danger">
        <div className="w-4 h-4 rounded-full bg-danger shrink-0" />
        <p className="text-sm font-semibold">
          {currentStatus === 'atmesta' ? 'Užsakymas atmestas restorano' : 'Užsakymas atšauktas'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 mt-4">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <div key={step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${
                done ? 'bg-primary border-primary' : 'bg-white border-gray-300'
              } ${active ? 'ring-2 ring-primary/30' : ''}`} />
              {i < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 ${done && i < currentIdx ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
            <p className={`text-sm pt-0.5 ${active ? 'font-semibold text-primary' : done ? 'text-gray-700' : 'text-gray-400'}`}>
              {labels[step]}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function RouteCard({ pickupAddress, deliveryAddress }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Maršrutas</h3>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Paėmimo vieta</p>
            <p className="text-sm text-gray-800 mt-0.5">{pickupAddress || '—'}</p>
          </div>
        </div>
        <div className="ml-3.5 w-0.5 h-4 bg-gray-200" />
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Pristatymo vieta</p>
            <p className="text-sm text-gray-800 mt-0.5">{deliveryAddress || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailScreen() {
  const { id } = useParams()
  const { user } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [ratingTarget, setRatingTarget] = useState(null) // { id, label }
  const [ratedUserBalance, setRatedUserBalance] = useState(null)

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch(() => showToast('Užsakymo nepavyko užkrauti', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const reload = () => getOrder(id).then(setOrder).catch(() => {})

  const handleConfirmByRestoranas = async () => {
    setActionLoading(true)
    try {
      await confirmOrder(id)
      showToast('Užsakymas patvirtintas! Gavėjas informuotas.', 'success')
      await reload()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(false) }
  }

  const handleDeclineByRestoranas = async () => {
    setActionLoading(true)
    try {
      await declineOrder(id)
      showToast('Užsakymas atmestas.', 'info')
      navigate('/uzsakymai')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(false) }
  }

  const handleAccept = async () => {
    setActionLoading(true)
    try {
      await confirmDelivery(id)
      showToast('Užsakymas priimtas! Pristatykite maistą.', 'success')
      await reload()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(false) }
  }

  const handleDecline = async () => {
    setActionLoading(true)
    try {
      await declineOrder(id)
      showToast('Užsakymas atmestas.', 'info')
      navigate('/uzsakymai')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(false) }
  }

  const handleDelivered = async () => {
    setActionLoading(true)
    try {
      await confirmDelivery(id)
      showToast('Pristatymas patvirtintas! Taškai pridėti.', 'success')
      await reload()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(false) }
  }

  const openRating = async (targetId, label, targetType) => {
    setRatingTarget({ id: targetId, label, targetType })
    setShowRating(true)
    try {
      const { getUserProfile } = await import('../api/users')
      const profile = await getUserProfile(targetId)
      setRatedUserBalance(profile?.points_balance ?? null)
    } catch {
      setRatedUserBalance(null)
    }
  }

  const handleRating = async (data) => {
    await submitFeedback({
      ...data,
      reviewed_user_id: ratingTarget.id,
      target_type: ratingTarget.targetType,
    })
    showToast('Ačiū už įvertinimą!', 'success')
    await reload()
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Užsakymas" showBack />
        <div className="screen-content flex items-center justify-center">
          <p className="text-gray-400">Kraunama...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div>
        <TopBar title="Užsakymas" showBack />
        <div className="screen-content flex items-center justify-center">
          <p className="text-gray-400">Užsakymas nerastas</p>
        </div>
      </div>
    )
  }

  const isRestoranas = user?.role === 'restoranas' || user?.role === 'davejas'
  const isTransportuotojas = user?.role === 'transportuotojas'
  const isGavejas = user?.role === 'gavejas'
  const isMyDelivery = order.transportuotojas_id === user?.id

  // Restorano veiksmai
  const showRestoranasConfirm = isRestoranas && order.status === 'laukiama_patvirtinimo'
  // Transportuotojo veiksmai
  const showAcceptDecline = isTransportuotojas && order.status === 'laukiama'
  const showDelivered = isTransportuotojas && order.status === 'pristatoma' && isMyDelivery
  // Gavėjas gali įvertinti transportuotoją
  const showRateTransportuotojas = isGavejas && order.status === 'ivykdyta' && !order.has_feedback_transport && order.transportuotojas_id
  // Gavėjas gali įvertinti restoraną
  const showRateRestoranas = isGavejas && order.status === 'ivykdyta' && !order.has_feedback_restoranas && order.restoranas_id

  return (
    <div>
      <TopBar title={`Užsakymas #${order.id?.toString().slice(-6)}`} showBack />
      <div className="screen-content px-4 py-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Būsena</p>
            <StatusBadge status={order.status} />
          </div>

          {order.offer?.title && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Pasiūlymas</p>
              <p className="font-semibold text-gray-900 mt-0.5">{order.offer.title}</p>
            </div>
          )}

          {order.gavejas_name && isRestoranas && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Gavėjas</p>
              <p className="text-sm text-gray-800 mt-0.5">👤 {order.gavejas_name}</p>
            </div>
          )}

          {order.created_at && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Pateikta</p>
              <p className="text-sm text-gray-700 mt-0.5">
                {new Date(order.created_at).toLocaleString('lt-LT')}
              </p>
            </div>
          )}

          <Timeline currentStatus={order.status} />
        </div>

        {/* Maršrutas transportuotojui */}
        {isTransportuotojas && isMyDelivery && order.status === 'pristatoma' && (
          <RouteCard pickupAddress={order.pickup_address} deliveryAddress={order.delivery_address} />
        )}

        {/* Restoranas: patvirtinti arba atmesti gavėją */}
        {showRestoranasConfirm && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Ar norite patvirtinti šį gavėją?
            </p>
            <div className="flex gap-3">
              <button onClick={handleDeclineByRestoranas} disabled={actionLoading}
                className="flex-1 bg-danger/10 text-danger border border-danger/20 py-4 rounded-pill font-semibold disabled:opacity-60 active:bg-danger/20">
                {actionLoading ? '...' : '✕ Atmesti'}
              </button>
              <button onClick={handleConfirmByRestoranas} disabled={actionLoading}
                className="flex-1 bg-primary text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:bg-primary-dark">
                {actionLoading ? '...' : '✓ Patvirtinti'}
              </button>
            </div>
          </div>
        )}

        {/* Transportuotojas: priimti arba atmesti */}
        {showAcceptDecline && (
          <div className="flex gap-3 mb-4">
            <button onClick={handleDecline} disabled={actionLoading}
              className="flex-1 bg-danger/10 text-danger border border-danger/20 py-4 rounded-pill font-semibold disabled:opacity-60 active:bg-danger/20">
              {actionLoading ? '...' : '✕ Atmesti'}
            </button>
            <button onClick={handleAccept} disabled={actionLoading}
              className="flex-1 bg-primary text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:bg-primary-dark">
              {actionLoading ? '...' : '✓ Priimti'}
            </button>
          </div>
        )}

        {/* Transportuotojas: patvirtinti pristatymą */}
        {showDelivered && (
          <button onClick={handleDelivered} disabled={actionLoading}
            className="w-full bg-accent text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:opacity-80 mb-4">
            {actionLoading ? '...' : '🚚 Patvirtinti pristatymą'}
          </button>
        )}

        {/* Gavėjas: įvertinti transportuotoją */}
        {showRateTransportuotojas && (
          <button onClick={() => openRating(order.transportuotojas_id, 'transportuotoją', 'transportuotojas')}
            className="w-full bg-primary text-white py-4 rounded-pill font-semibold shadow-md active:bg-primary-dark mb-4">
            ⭐ Įvertinti transportuotoją
          </button>
        )}

        {/* Gavėjas: įvertinti restoraną */}
        {showRateRestoranas && (
          <button onClick={() => openRating(order.restoranas_id, 'restoraną', 'restoranas')}
            className="w-full bg-accent text-white py-4 rounded-pill font-semibold shadow-md active:opacity-80 mb-4">
            ⭐ Įvertinti restoraną
          </button>
        )}
      </div>

      {showRating && (
        <RatingModal
          orderId={order.id}
          title={`Įvertinkite ${ratingTarget?.label}`}
          commentOnly={ratingTarget?.targetType === 'restoranas'}
          reviewedBalance={ratingTarget?.targetType !== 'restoranas' ? ratedUserBalance : null}
          onSubmit={handleRating}
          onClose={() => { setShowRating(false); setRatedUserBalance(null) }}
        />
      )}
    </div>
  )
}
