import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useToast } from '../context/ToastContext'
import { createGerimoPasiulymas } from '../api/gerimoPasiulymai'
import useGeolocation from '../hooks/useGeolocation'
import { getDrinkImage, DRINK_IMAGES } from '../utils/drinkImage'

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
      const result = await createGerimoPasiulymas({ ...form, lat: lat ?? undefined, lng: lng ?? undefined })
      if (selectedImage && result?.id) {
        localStorage.setItem(`drinkImg_${result.id}`, selectedImage)
      }
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

  const autoImage = getDrinkImage(form.pavadinimas, null)
  const displayImage = selectedImage || autoImage
  const selected = DRINK_IMAGES.find((i) => i.file === displayImage)

  return (
    <div>
      <TopBar title="Naujas gėrimo pasiūlymas" showBack />
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
                <div className="grid grid-cols-4 gap-2">
                  {DRINK_IMAGES.map(({ file, label }) => (
                    <button
                      key={file}
                      type="button"
                      onClick={() => { setSelectedImage(file); setDropdownOpen(false) }}
                      className={`rounded-xl overflow-hidden border-2 transition-all ${
                        displayImage === file ? 'border-accent ring-2 ring-accent/20' : 'border-transparent'
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
