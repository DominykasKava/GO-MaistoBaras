import { useState, useEffect } from 'react'

const VILNIUS = { lat: 54.6872, lng: 25.2797 }

export default function useGeolocation() {
  const [state, setState] = useState({ lat: null, lng: null, error: null, loading: true })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ ...VILNIUS, error: 'Geolocation not supported', loading: false })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false })
      },
      () => {
        setState({ ...VILNIUS, error: 'Location unavailable', loading: false })
      },
      { timeout: 8000 }
    )
  }, [])

  return state
}
