import React from 'react'
import { useNavigate } from 'react-router-dom'

const STATUS_CONFIG = {
  laukiama_patvirtinimo: { label: 'Laukia patvirtinimo', bg: 'bg-accent/20',   text: 'text-accent' },
  laukiama:              { label: 'Laukiama',             bg: 'bg-accent/30',   text: 'text-accent' },
  patvirtinta:           { label: 'Patvirtinta',          bg: 'bg-primary/20',  text: 'text-primary' },
  pristatoma:            { label: 'Pristatoma',           bg: 'bg-primary/30',  text: 'text-primary' },
  ivykdyta:              { label: 'Įvykdyta',             bg: 'bg-primary',     text: 'text-white' },
  atsaukta:              { label: 'Atšaukta',             bg: 'bg-danger/20',   text: 'text-danger' },
  atmesta:               { label: 'Atmesta',              bg: 'bg-danger',      text: 'text-white' },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-primary/10', text: 'text-primary' }
  return (
    <span className={`${cfg.bg} ${cfg.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>
      {cfg.label}
    </span>
  )
}

export default function OrderCard({ order }) {
  const navigate = useNavigate()
  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString('lt-LT')
    : null

  return (
    <div
      onClick={() => navigate(`/uzsakymai/${order.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-border p-4 cursor-pointer active:bg-surface transition-colors"
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            Užsakymas #{order.id?.toString().slice(-6) ?? order.id}
          </p>
          {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
          {order.offer?.title && (
            <p className="text-sm text-gray-600 mt-1 truncate max-w-[200px]">{order.offer.title}</p>
          )}
          {order.gavejas_name && (
            <p className="text-xs text-gray-400 mt-0.5">👤 {order.gavejas_name}</p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>
    </div>
  )
}
