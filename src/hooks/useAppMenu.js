import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function useAppMenu(onSearch) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items = [
    {
      label: '👤 Profilis',
      onClick: () => navigate('/profilis'),
    },
    {
      label: '🔍 Kiti naudotojai',
      onClick: () => onSearch?.(),
    },
  ]

  if (user?.role === 'restoranas' || user?.role === 'davejas') {
    items.push({
      label: '➕ Pateikti pasiūlymą',
      onClick: () => navigate('/pasiulymai/sukurti'),
    })
  }

  if (user?.role === 'restoranas') {
    items.push({
      label: '🍹 Pateikti gėrimo siūlymą',
      onClick: () => navigate('/taskai/gerimas/sukurti'),
    })
  }

  if (user?.role === 'gavejas' || user?.role === 'transportuotojas') {
    items.push({
      label: '🍹 Taškų panaudojimas',
      onClick: () => navigate('/taskai/gerimas'),
    })
  }

  items.push({
    label: '🚪 Atsijungti',
    onClick: async () => { await logout(); navigate('/login') },
    danger: true,
  })

  return items
}
