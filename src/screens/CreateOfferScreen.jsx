import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useToast } from '../context/ToastContext'
import { createOffer } from '../api/offers'
import useGeolocation from '../hooks/useGeolocation'
import { getOfferImage, OFFER_IMAGES } from '../utils/offerImage'

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
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await createOffer({ ...form, lat: lat ?? undefined, lng: lng ?? undefined })
      if (selectedImage && result?.id) {
        localStorage.setItem(`offerImg_${result.id}`, selectedImage)
      }
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

  const autoImage = getOfferImage(form.title, null)
  const displayImage = selectedImage || autoImage
  const selected = OFFER_IMAGES.find((i) => i.file === displayImage)

  return (
    <div>
      <TopBar title="Naujas pasiūlymas" showBack />
      <div className="screen-content px-4 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div ref={dropdownRef} className="relative">
            <label className={labelClass}>Nuotrauka</label>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 flex items-center justify-between gap-3"
            >
              {selected ? (
                <div className="flex items-center gap-3">
                  <img src={`/${selected.file}`} alt={selected.label}
                    className="w-8 h-8 rounded-xl object-cover shrink-0" />
                  <span className="text-gray-900">
                    {selected.label}
                    {!selectedImage && autoImage && <span className="text-gray-400 ml-1">(automatiškai)</span>}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400">Pasirinkite nuotrauką...</span>
              )}
              <span className="text-gray-400 text-xs">{dropdownOpen ? '▲' : '▼'}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl p-3">
                <div className="grid grid-cols-3 gap-2">
                  {OFFER_IMAGES.map(({ file, label }) => (
                    <button
                      key={file}
                      type="button"
                      onClick={() => { setSelectedImage(file); setDropdownOpen(false) }}
                      className={`rounded-xl overflow-hidden border-2 transition-all ${
                        displayImage === file ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                      }`}
                    >
                      <img src={`/${file}`} alt={label} className="w-full aspect-square object-cover" />
                      <p className="text-[11px] text-center py-1 text-gray-600 truncate px-1">{label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
