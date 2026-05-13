import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useToast } from '../context/ToastContext'
import { createGerimoPasiulymas } from '../api/gerimoPasiulymai'
import useGeolocation from '../hooks/useGeolocation'

export default function CreateDrinkOfferScreen() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { lat, lng } = useGeolocation()
  const [form, setForm] = useState({
    pavadinimas: '',
    aprasymas: '',
    kiekis: '',
    galioja_iki: '',
    adresas: '',
    kaina_taskais: '',
    transporter_points: '30',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createGerimoPasiulymas({ ...form, lat: lat ?? undefined, lng: lng ?? undefined })
      showToast('Gėrimo pasiūlymas sukurtas!', 'success')
      navigate('/pasiulymai')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida kuriant pasiūlymą', 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-gray-50'
  const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

  return (
    <div>
      <TopBar title="Naujas gėrimo pasiūlymas" showBack />
      <div className="screen-content px-4 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className={labelClass}>Pavadinimas *</label>
            <input name="pavadinimas" required value={form.pavadinimas} onChange={handleChange}
              placeholder="pvz. Šviežiai spausta apelsinų sultys" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Aprašymas</label>
            <textarea name="aprasymas" value={form.aprasymas} onChange={handleChange}
              rows={3} placeholder="Trumpas aprašymas apie gėrimą..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-gray-50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Kiekis *</label>
              <input name="kiekis" required value={form.kiekis} onChange={handleChange}
                placeholder="pvz. 5 stiklinės" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Galioja iki</label>
              <input name="galioja_iki" type="datetime-local" value={form.galioja_iki}
                onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Kaina taškais ⭐ *</label>
            <input name="kaina_taskais" type="number" min={1} max={99999} required
              value={form.kaina_taskais} onChange={handleChange}
              placeholder="pvz. 50" className={inputClass} />
            <p className="text-xs text-accent/70 mt-1.5">
              Tiek taškų gavejas sumokės už šį gėrimą
            </p>
          </div>

          <div>
            <label className={labelClass}>Paėmimo adresas</label>
            <input name="adresas" value={form.adresas} onChange={handleChange}
              placeholder="pvz. Laisvės al. 10, Kaunas"
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Transportuotojo taškai ⭐</label>
            <input name="transporter_points" type="number" min={1} max={9999}
              value={form.transporter_points} onChange={handleChange}
              placeholder="30" className={inputClass} />
            <p className="text-xs text-primary/50 mt-1.5">
              Tiek taškų transportuotojas gaus už pristatymą
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="mt-1 bg-accent text-white py-4 rounded-pill font-bold text-sm uppercase tracking-wider shadow-md disabled:opacity-60 active:opacity-80 transition-opacity">
            {loading ? 'Kuriama...' : 'Sukurti gėrimo pasiūlymą'}
          </button>
        </form>
      </div>
    </div>
  )
}
