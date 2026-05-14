import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { StatusBadge } from '../components/OrderCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getGerimoUzsakymas,
  confirmGerimoUzsakymas,
  confirmGerimoDelivery,
  confirmGerimoReceipt,
  declineGerimoUzsakymas,
} from '../api/gerimoPasiulymai'

const STATUS_STEPS = ['laukiama_patvirtinimo', 'laukiama', 'pristatoma', 'ivykdyta']
const STATUS_LABELS = {
  laukiama_patvirtinimo: 'Laukia restorano patvirtinimo',
  laukiama: 'Laukiama transportuotojo',
  pristatoma: 'Pristatoma',
  ivykdyta: 'Įvykdyta',
}

function Timeline({ currentStatus }) {
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
              {STATUS_LABELS[step]}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function DrinkOrderDetailScreen() {
  const { id } = useParams()
  const { user } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    getGerimoUzsakymas(id)
      .then(setOrder)
      .catch(() => showToast('Užsakymo nepavyko užkrauti', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const reload = () => getGerimoUzsakymas(id).then(setOrder).catch(() => {})

  const act = (fn, successMsg, onSuccess) => async () => {
    setActionLoading(true)
    try {
      await fn(id)
      showToast(successMsg, 'success')
      if (onSuccess) onSuccess()
      else await reload()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div><TopBar title="Gėrimo užsakymas" showBack /><div className="screen-content flex items-center justify-center"><p className="text-gray-400">Kraunama...</p></div></div>
  }
  if (!order) {
    return <div><TopBar title="Gėrimo užsakymas" showBack /><div className="screen-content flex items-center justify-center"><p className="text-gray-400">Užsakymas nerastas</p></div></div>
  }

  const isRestoranas = user?.role === 'restoranas'
  const isTransportuotojas = user?.role === 'transportuotojas'
  const isGavejas = user?.role === 'gavejas'
  const isMyDelivery = order.transportuotojas_id === user?.id

  const showRestoranasConfirm = isRestoranas && order.statusas === 'laukiama_patvirtinimo'
  const showAcceptDecline = isTransportuotojas && order.statusas === 'laukiama'
  const showDelivered = isTransportuotojas && order.statusas === 'pristatoma' && isMyDelivery
  const showConfirmReceipt = isGavejas && order.statusas === 'pristatoma'

  return (
    <div>
      <TopBar title={`Gėrimo užsakymas #${order.id?.toString().slice(-6)}`} showBack />
      <div className="screen-content px-4 py-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Būsena</p>
            <StatusBadge status={order.statusas} />
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Gėrimas</p>
            <p className="font-semibold text-gray-900 mt-0.5">🍹 {order.pavadinimas}</p>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Restoranas</p>
            <p className="text-sm text-gray-800 mt-0.5">{order.restoranas_name}</p>
            {order.pickup_adresas && <p className="text-xs text-gray-400 mt-0.5">{order.pickup_adresas}</p>}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Kaina</p>
            <p className="text-sm font-bold text-accent mt-0.5">⭐ {order.taskai_nuskaityti} taškai</p>
          </div>

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

          <Timeline currentStatus={order.statusas} />
        </div>

        {showRestoranasConfirm && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 text-center">Ar norite patvirtinti šį gavėją?</p>
            <div className="flex gap-3">
              <button onClick={act(declineGerimoUzsakymas, 'Užsakymas atmestas.', () => navigate('/uzsakymai'))}
                disabled={actionLoading}
                className="flex-1 bg-danger/10 text-danger border border-danger/20 py-4 rounded-pill font-semibold disabled:opacity-60 active:bg-danger/20">
                {actionLoading ? '...' : '✕ Atmesti'}
              </button>
              <button onClick={act(confirmGerimoUzsakymas, 'Užsakymas patvirtintas!')}
                disabled={actionLoading}
                className="flex-1 bg-primary text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:bg-primary-dark">
                {actionLoading ? '...' : '✓ Patvirtinti'}
              </button>
            </div>
          </div>
        )}

        {showAcceptDecline && (
          <div className="flex gap-3 mb-4">
            <button onClick={act(declineGerimoUzsakymas, 'Užsakymas atmestas.', () => navigate('/uzsakymai'))}
              disabled={actionLoading}
              className="flex-1 bg-danger/10 text-danger border border-danger/20 py-4 rounded-pill font-semibold disabled:opacity-60 active:bg-danger/20">
              {actionLoading ? '...' : '✕ Atmesti'}
            </button>
            <button onClick={act(confirmGerimoDelivery, 'Užsakymas priimtas! Pristatykite gėrimą.')}
              disabled={actionLoading}
              className="flex-1 bg-primary text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:bg-primary-dark">
              {actionLoading ? '...' : '✓ Priimti'}
            </button>
          </div>
        )}

        {showDelivered && (
          <button onClick={act(confirmGerimoDelivery, 'Pristatymas patvirtintas! Taškai pridėti.')}
            disabled={actionLoading}
            className="w-full bg-accent text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:opacity-80 mb-4">
            {actionLoading ? '...' : '🚚 Patvirtinti pristatymą'}
          </button>
        )}

        {showConfirmReceipt && (
          <button onClick={act(confirmGerimoReceipt, 'Gavimas patvirtintas!')}
            disabled={actionLoading}
            className="w-full bg-primary text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:bg-primary-dark mb-4">
            {actionLoading ? '...' : '✓ Patvirtinti gavimą'}
          </button>
        )}
      </div>
    </div>
  )
}
