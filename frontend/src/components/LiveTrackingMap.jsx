import { useEffect, useRef, useState } from 'react'
import { getLocationTracking } from '../services/api'

/**
 * Live Tracking Map Component
 * Displays Google Maps with real-time delivery location tracking
 */
export default function LiveTrackingMap({ orderId, refreshInterval = 5000 }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const polylineRef = useRef(null)
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [apiKey, setApiKey] = useState(null)

  // Load tracking data first to get API key
  const loadTrackingData = async () => {
    try {
      const response = await getLocationTracking(orderId)
      const data = response.data
      
      if (!data.trackingEnabled) {
        setError('Location tracking is not available for this order yet.')
        setLoading(false)
        return
      }

      // Get API key from response
      if (data.googleMapsApiKey && !apiKey) {
        setApiKey(data.googleMapsApiKey)
      }

      setTrackingData(data)
      setError(null)
      
      if (mapInstanceRef.current && data.currentLocation) {
        updateMap(data)
      }
    } catch (err) {
      console.error('Error loading tracking data:', err)
      setError(err.response?.data?.error || 'Failed to load tracking data')
      setLoading(false)
    }
  }

  // Load Google Maps script once we have the API key
  useEffect(() => {
    // Use API key from backend or fallback to env variable
    const key = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    
    if (!key) {
      // If no API key yet, wait for tracking data to load it
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      // Script already loaded, just mark as loaded
      if (window.google) {
        setGoogleMapsLoaded(true)
      } else {
        existingScript.addEventListener('load', () => setGoogleMapsLoaded(true))
      }
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setGoogleMapsLoaded(true)
    }
    
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key and ensure billing is enabled.')
      setLoading(false)
    }
    
    // Listen for Google Maps errors
    window.gm_authFailure = () => {
      setError('Google Maps API error: Please check your API key configuration and ensure billing is enabled on your Google Cloud project.')
      setLoading(false)
    }
    
    document.head.appendChild(script)
    
    return () => {
      // Don't remove script on unmount as it might be used by other components
    }
  }, [apiKey])

  // Initialize map when Google Maps is loaded and we have tracking data
  useEffect(() => {
    if (!googleMapsLoaded || !window.google) return

    if (!mapRef.current) return

    try {
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 12.9716, lng: 77.5946 }, // Default to Bangalore
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map

      // If we already have tracking data, update the map
      if (trackingData && trackingData.currentLocation) {
        updateMap(trackingData)
      }
    } catch (mapError) {
      console.error('Error initializing map:', mapError)
      if (mapError.message && mapError.message.includes('BillingNotEnabled')) {
        setError('Google Maps requires billing to be enabled. Please enable billing on your Google Cloud project.')
      } else {
        setError('Failed to initialize Google Maps: ' + mapError.message)
      }
      setLoading(false)
    }
  }, [googleMapsLoaded, trackingData])


  // Update map with tracking data
  const updateMap = (data) => {
    if (!mapInstanceRef.current || !window.google) return

    const map = mapInstanceRef.current
    const { google } = window

    // Parse locations
    const currentLocation = data.currentLocation
    const pickupLocation = data.pickupLocation
    const deliveryLocation = data.deliveryLocation
    const locationHistory = data.locationHistory || []

    const bounds = new google.maps.LatLngBounds()
    const locations = []

    // Add pickup location marker
    if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
      const pickupLatLng = { lat: pickupLocation.lat, lng: pickupLocation.lng }
      locations.push(pickupLatLng)
      bounds.extend(pickupLatLng)

      if (!markersRef.current.pickup) {
        markersRef.current.pickup = new google.maps.Marker({
          position: pickupLatLng,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: 'Pickup Location',
          label: {
            text: 'P',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        })

        // Add info window for pickup
        const pickupInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>Pickup Location</strong><br/>
              ${pickupLocation.address || 'Pickup point'}
            </div>
          `
        })
        markersRef.current.pickup.addListener('click', () => {
          pickupInfoWindow.open(map, markersRef.current.pickup)
        })
      }
    }

    // Add delivery location marker
    if (deliveryLocation && deliveryLocation.lat && deliveryLocation.lng) {
      const deliveryLatLng = { lat: deliveryLocation.lat, lng: deliveryLocation.lng }
      locations.push(deliveryLatLng)
      bounds.extend(deliveryLatLng)

      if (!markersRef.current.delivery) {
        markersRef.current.delivery = new google.maps.Marker({
          position: deliveryLatLng,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#34A853',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: 'Delivery Location',
          label: {
            text: 'D',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        })

        // Add info window for delivery
        const deliveryInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>Delivery Location</strong><br/>
              ${deliveryLocation.address || 'Delivery address'}
            </div>
          `
        })
        markersRef.current.delivery.addListener('click', () => {
          deliveryInfoWindow.open(map, markersRef.current.delivery)
        })
      }
    }

    // Add current location marker (delivery man)
    if (currentLocation && currentLocation.lat && currentLocation.lng) {
      const currentLatLng = { lat: currentLocation.lat, lng: currentLocation.lng }
      locations.push(currentLatLng)
      bounds.extend(currentLatLng)

      // Remove old current location marker
      if (markersRef.current.current) {
        markersRef.current.current.setMap(null)
      }

      // Create new current location marker with animation
      markersRef.current.current = new google.maps.Marker({
        position: currentLatLng,
        map: map,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: currentLocation.heading || 0
        },
        title: 'Current Location',
        animation: google.maps.Animation.DROP,
        zIndex: 1000
      })

      // Add info window for current location
      const currentInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>Delivery Man Location</strong><br/>
            ${currentLocation.address || 'Current location'}<br/>
            <small>Updated: ${new Date(currentLocation.timestamp).toLocaleTimeString()}</small>
          </div>
        `
      })
      markersRef.current.current.addListener('click', () => {
        currentInfoWindow.open(map, markersRef.current.current)
      })
    }

    // Draw route polyline if we have location history
    if (locationHistory.length > 0) {
      const path = locationHistory.map(loc => ({
        lat: loc.lat,
        lng: loc.lng
      }))

      // Add current location to path if available
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        path.push({ lat: currentLocation.lat, lng: currentLocation.lng })
      }

      // Remove old polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }

      // Create new polyline
      polylineRef.current = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#EA4335',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      })
    }

    // Draw route from current to delivery if route data is available
    if (data.route && data.route.polyline && currentLocation && deliveryLocation) {
      try {
        const decodedPath = google.maps.geometry.encoding.decodePath(data.route.polyline)
        
        if (polylineRef.current) {
          polylineRef.current.setMap(null)
        }

        polylineRef.current = new google.maps.Polyline({
          path: decodedPath,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 0.6,
          strokeWeight: 3,
          map: map
        })
      } catch (e) {
        console.error('Error decoding polyline:', e)
        // Fallback: draw direct line
        if (currentLocation && deliveryLocation) {
          if (polylineRef.current) {
            polylineRef.current.setMap(null)
          }
          polylineRef.current = new google.maps.Polyline({
            path: [
              { lat: currentLocation.lat, lng: currentLocation.lng },
              { lat: deliveryLocation.lat, lng: deliveryLocation.lng }
            ],
            geodesic: true,
            strokeColor: '#4285F4',
            strokeOpacity: 0.6,
            strokeWeight: 3,
            map: map
          })
        }
      }
    }

    // Fit bounds to show all markers
    if (locations.length > 0) {
      map.fitBounds(bounds)
      // Add padding
      const padding = 50
      map.fitBounds(bounds, padding)
    }
  }

  // Load tracking data on mount and set up polling
  useEffect(() => {
    if (!orderId) return

    // Initial load
    loadTrackingData().then(() => {
      setLoading(false)
    })

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      loadTrackingData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [orderId, refreshInterval])

  if (loading && !trackingData) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isBillingError = error.includes('billing') || error.includes('BillingNotEnabled')
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center max-w-md px-4">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-700 font-semibold mb-2">Unable to load Google Maps</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          {isBillingError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold text-yellow-800 mb-2">To fix this issue:</p>
              <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Select your project</li>
                <li>Go to "Billing" in the menu</li>
                <li>Enable billing for your project</li>
                <li>Ensure the Maps JavaScript API is enabled</li>
              </ol>
              <p className="text-xs text-yellow-600 mt-2">
                Note: Google provides $200 free credit per month for Maps usage.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!trackingData || !trackingData.trackingEnabled) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-700 font-semibold mb-2">Location Tracking Not Available</p>
          <p className="text-gray-600 text-sm">The order has not been accepted by a delivery man yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Location Tracking</h3>
        {trackingData.route && (
          <div className="flex gap-4 text-sm">
            {trackingData.route.distanceText && (
              <span className="text-gray-600">
                <strong>Distance:</strong> {trackingData.route.distanceText}
              </span>
            )}
            {trackingData.route.durationText && (
              <span className="text-gray-600">
                <strong>ETA:</strong> {trackingData.route.durationText}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="relative">
        <div ref={mapRef} className="w-full h-96 rounded-lg shadow-lg" />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-10">
          <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-xs text-gray-600">Pickup</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-600">Delivery</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-xs text-gray-600">Current</span>
            </div>
          </div>
        </div>
      </div>
      
      {trackingData.currentLocation && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Last Update:</strong> {new Date(trackingData.currentLocation.timestamp).toLocaleString()}
          </p>
          {trackingData.currentLocation.address && (
            <p className="text-sm text-gray-600 mt-1">
              {trackingData.currentLocation.address}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
