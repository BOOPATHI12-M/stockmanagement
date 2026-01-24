import { useEffect, useRef, useState } from 'react'

/**
 * Delivery Location Map Component
 * Shows the delivery location on a map based on pincode
 */
export default function DeliveryLocationMap({ pincode, address, orderId }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD64sXrzrd8KHrzWZJV1K2FQG1-gfuOlMs'

  // Geocode pincode to get coordinates
  const geocodePincode = async (pincode) => {
    try {
      // Use Nominatim (OpenStreetMap) - free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pincode + ', India')}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Sudharshini-Stock-Management/1.0'
          }
        }
      )
      
      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        }
      }
      
      throw new Error('No location found for pincode')
    } catch (err) {
      console.error('Error geocoding pincode:', err)
      throw err
    }
  }

  // Load location data
  useEffect(() => {
    const loadLocation = async () => {
      if (!pincode) {
        setError('Pincode is required')
        setLoading(false)
        return
      }

      try {
        // Try to get location from order tracking data first
        if (orderId) {
          try {
            const response = await fetch(`/api/orders/${orderId}/location-tracking`)
            if (response.ok) {
              const data = await response.json()
              if (data.deliveryLocation && data.deliveryLocation.lat && data.deliveryLocation.lng) {
                setLocation({
                  lat: data.deliveryLocation.lat,
                  lng: data.deliveryLocation.lng,
                  address: data.deliveryLocation.address || address
                })
                setLoading(false)
                return
              }
            }
          } catch (e) {
            console.log('Could not get location from tracking data, geocoding pincode...')
          }
        }

        // Fallback: geocode pincode
        const loc = await geocodePincode(pincode)
        setLocation(loc)
      } catch (err) {
        setError('Failed to get location for pincode: ' + pincode)
        console.error('Error loading location:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLocation()
  }, [pincode, orderId, address])

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is not configured')
      setLoading(false)
      return
    }

    // Set up global error handler to catch Google Maps API errors
    window.gm_authFailure = () => {
      setError('Google Maps API error. Using alternative map view.')
      setLoading(false)
      // Hide Google Maps error overlay
      setTimeout(() => {
        const errorOverlay = document.querySelector('[style*="background-color: white"][style*="font-weight: 500"]')
        if (errorOverlay) {
          errorOverlay.style.display = 'none'
        }
      }, 100)
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      if (window.google) {
        setGoogleMapsLoaded(true)
      } else {
        existingScript.addEventListener('load', () => setGoogleMapsLoaded(true))
      }
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setGoogleMapsLoaded(true)
      // Hide any Google Maps error overlays
      setTimeout(() => {
        const errorOverlays = document.querySelectorAll('[style*="background-color: white"][style*="font-weight: 500"]')
        errorOverlays.forEach(overlay => {
          if (overlay.textContent && overlay.textContent.includes("can't load Google Maps")) {
            overlay.style.display = 'none'
          }
        })
      }, 500)
    }
    
    script.onerror = () => {
      setError('Failed to load Google Maps')
      setLoading(false)
    }
    
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      // Remove error handler on unmount
      if (window.gm_authFailure) {
        delete window.gm_authFailure
      }
    }
  }, [apiKey])

  // Hide Google Maps error overlays
  useEffect(() => {
    const hideErrorOverlays = () => {
      // Hide all white background divs that look like error messages
      const errorOverlays = document.querySelectorAll('div[style*="background-color: white"][style*="font-weight: 500"]')
      errorOverlays.forEach(overlay => {
        const text = overlay.textContent || ''
        if (text.includes("can't load Google Maps") || 
            text.includes("Do you own this website") ||
            text.includes("This page can't load")) {
          overlay.style.display = 'none'
          overlay.style.visibility = 'hidden'
          overlay.style.opacity = '0'
          overlay.style.pointerEvents = 'none'
        }
      })
      
      // Also hide any divs with specific Google Maps error styling
      const allDivs = document.querySelectorAll('div')
      allDivs.forEach(div => {
        const style = div.getAttribute('style') || ''
        const text = div.textContent || ''
        if (style.includes('background-color: white') && 
            style.includes('font-weight: 500') &&
            (text.includes("can't load Google Maps") || text.includes("Do you own this website"))) {
          div.style.display = 'none'
          div.style.visibility = 'hidden'
          div.style.opacity = '0'
          div.style.pointerEvents = 'none'
        }
      })
    }

    // Hide immediately and set up interval to catch dynamically added overlays
    hideErrorOverlays()
    const interval = setInterval(hideErrorOverlays, 300)

    // Also use MutationObserver to catch dynamically added elements
    const observer = new MutationObserver(hideErrorOverlays)
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  // Initialize map when Google Maps is loaded and we have location
  useEffect(() => {
    if (!googleMapsLoaded || !window.google || !location) return
    if (!mapRef.current) return

    try {
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: location.lat, lng: location.lng },
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        // Disable default UI controls that might show errors
        disableDefaultUI: false,
        gestureHandling: 'cooperative'
      })

      mapInstanceRef.current = map

      // Hide any error overlays after map initialization
      setTimeout(() => {
        const errorOverlays = document.querySelectorAll('[style*="background-color: white"][style*="font-weight: 500"]')
        errorOverlays.forEach(overlay => {
          if (overlay.textContent && overlay.textContent.includes("can't load Google Maps")) {
            overlay.style.display = 'none'
          }
        })
      }, 1000)

      // Add marker for delivery location
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }

      markerRef.current = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#34A853',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        title: 'Delivery Location',
        animation: window.google.maps.Animation.DROP
      })

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <strong style="color: #34A853; font-size: 14px;">📍 Delivery Location</strong><br/>
            <p style="margin: 4px 0; color: #333; font-size: 13px;">${location.address || address || 'Pincode: ' + pincode}</p>
            <p style="margin: 4px 0; color: #666; font-size: 12px;">Pincode: ${pincode}</p>
          </div>
        `
      })

      markerRef.current.addListener('click', () => {
        infoWindow.open(map, markerRef.current)
      })

      // Open info window by default
      infoWindow.open(map, markerRef.current)
    } catch (mapError) {
      console.error('Error initializing map:', mapError)
      setError('Failed to initialize map: ' + mapError.message)
      setLoading(false)
    }
  }, [googleMapsLoaded, location, pincode, address])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#06b6d4' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
        <div className="text-center">
          <svg className="h-8 w-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-2">
        <h4 className="font-semibold text-white mb-1 flex items-center">
          <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Delivery Location Map
        </h4>
        <p className="text-xs text-gray-400">Pincode: {pincode}</p>
      </div>
      <div className="relative" style={{ position: 'relative', overflow: 'hidden' }}>
        <div ref={mapRef} className="w-full h-64 rounded-lg shadow-lg" style={{ minHeight: '256px', position: 'relative' }} />
      </div>
    </div>
  )
}

