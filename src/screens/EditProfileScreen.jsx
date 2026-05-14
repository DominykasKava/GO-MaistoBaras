import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', address: user?.address ?? '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await client.put('/users/me', form)
      updateUser(data?.user ?? data)
      showToast('Profilis atnaujintas!', 'success')
      navigate('/profilis')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida atnaujinant profilį', 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-pill px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

  return (
    <div>
      <TopBar title="Redaguoti profilį" showBack />
      <div className="screen-content px-4 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vardas</label>
            <input name="name" required value={form.name} onChange={handleChange}
              placeholder="Jūsų vardas" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono numeris</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="+370 600 00000" className={inputClass} />
          </div>
          {user?.role === 'gavejas' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pristatymo adresas</label>
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="pvz. Laisvės al. 10, Kaunas" className={inputClass} />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-primary text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-60 active:bg-primary-dark transition-colors"
          >
            {loading ? 'Saugoma...' : 'Išsaugoti'}
          </button>
        </form>
      </div>
    </div>
  )
}
