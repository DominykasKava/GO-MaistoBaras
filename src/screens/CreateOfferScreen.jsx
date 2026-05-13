import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useToast } from '../context/ToastContext'
import { createOffer } from '../api/offers'
import useGeolocation from '../hooks/useGeolocation'

export default function CreateOfferScreen() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { lat, lng } = useGeolocation()
  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    expires_at: '',
    address: '',
    pickup_instructions: '',
    transporter_points: '30',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createOffer({ ...form, lat: lat ?? undefined, lng: lng ?? undefined })
      showToast('Pasiūlymas sukurtas!', 'success')
      navigate('/pasiulymai')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida kuriant pasiūlymą', 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-gray-50'
  const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

  return (
    <div>
      <TopBar title="Naujas pasiūlymas" showBack />
      <div className="screen-content px-4 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className={labelClass}>Pavadinimas *</label>
            <input name="title" required value={form.title} onChange={handleChange}
              placeholder="pvz. Naminis obuolių pyragas" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Aprašymas</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Trumpas aprašymas apie maistą..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-gray-50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Kiekis *</label>
              <input name="quantity" required value={form.quantity} onChange={handleChange}
                placeholder="pvz. 3 porcijos" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Galioja iki</label>
              <input name="expires_at" type="datetime-local" value={form.expires_at}
                onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Paėmimo adresas</label>
            <input name="address" value={form.address} onChange={handleChange}
              placeholder="pvz. Laisvės al. 10, Kaunas"
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Paėmimo instrukcijos</label>
            <input name="pickup_instructions" value={form.pickup_instructions}
              onChange={handleChange} placeholder="pvz. Skambinti prie durų, 2 aukštas"
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Transportuotojo taškai ⭐</label>
            <input name="transporter_points" type="number" min={1} max={9999}
              value={form.transporter_points} onChange={handleChange}
              placeholder="30" className={inputClass} />
            <p className="text-xs text-primary/50 mt-1.5">
              Tiek taškų transportuotojas gaus už šio pasiūlymo pristatymą
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="mt-1 bg-primary text-white py-4 rounded-pill font-bold text-sm uppercase tracking-wider shadow-md disabled:opacity-60 active:bg-primary-dark transition-colors">
            {loading ? 'Kuriama...' : 'Sukurti pasiūlymą'}
          </button>
        </form>
      </div>
    </div>
  )
}
