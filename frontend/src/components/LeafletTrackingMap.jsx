import { useEffect, useRef, useState } from 'react'
import { getLocationTracking, generateFakeLocations } from '../services/api'

/**
 * Leaflet Tracking Map Component
 * Displays OpenStreetMap with real-time delivery location tracking (FREE - No API key needed)
 */
export default function LeafletTrackingMap({ orderId, refreshInterval = 5000 }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const polylineRef = useRef(null)
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [generatingFake, setGeneratingFake] = useState(false)

  // Load Leaflet CSS and JS
  useEffect(() => {
    // Check if Leaflet CSS is already loaded
    const existingLink = document.querySelector('link[href*="leaflet"]')
    if (!existingLink) {
      // Load Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    // Check if Leaflet JS is already loaded
    if (window.L) {
      console.log('Leaflet already loaded')
      setLeafletLoaded(true)
    } else {
      const existingScript = document.querySelector('script[src*="leaflet"]')
      if (!existingScript) {
        // Load Leaflet JS
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        script.async = true
        
        script.onload = () => {
          console.log('Leaflet library loaded successfully')
          setLeafletLoaded(true)
        }
        
        script.onerror = () => {
          setError('Failed to load map library. Please check your internet connection.')
          setLoading(false)
        }
        
        document.body.appendChild(script)
      } else {
        // Script exists but not loaded yet, wait for it
        existingScript.addEventListener('load', () => {
          console.log('Leaflet library loaded from existing script')
          setLeafletLoaded(true)
        })
        if (window.L) {
          setLeafletLoaded(true)
        }
      }
    }
    
    return () => {
      // Cleanup
      const existingLink = document.querySelector('link[href*="leaflet"]')
      const existingScript = document.querySelector('script[src*="leaflet"]')
      if (existingLink) existingLink.remove()
      if (existingScript) existingScript.remove()
    }
  }, [])

  // Load tracking data
  const loadTrackingData = async () => {
    try {
      const response = await getLocationTracking(orderId)
      const data = response.data
      
      if (!data.trackingEnabled) {
        setError('Location tracking is not available for this order yet.')
        setLoading(false)
        return
      }

      setTrackingData(data)
      setError(null)
      console.log('Tracking data loaded:', data)
      
      if (mapInstanceRef.current && data.currentLocation) {
        updateMap(data)
      } else if (mapInstanceRef.current) {
        // Even without current location, initialize map with pickup/delivery locations
        updateMap(data)
      }
    } catch (err) {
      console.error('Error loading tracking data:', err)
      setError(err.response?.data?.error || 'Failed to load tracking data')
      setLoading(false)
    }
  }

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !window.L) return

    if (!mapRef.current) return

    // Check if map is already initialized
    if (mapInstanceRef.current) {
      // Map already exists, just update it with tracking data if available
      if (trackingData && trackingData.currentLocation) {
        updateMap(trackingData)
      }
      return
    }

    // Wait a bit to ensure container is properly rendered
    const initMap = () => {
      try {
        // Ensure container has proper dimensions
        if (mapRef.current) {
          mapRef.current.style.width = '100%'
          mapRef.current.style.height = '100%'
          mapRef.current.style.minHeight = '384px' // 96 * 4 (h-96)
        }

        // Check if container already has a map (Leaflet stores this internally)
        if (mapRef.current._leaflet_id) {
          // Container already initialized, skip
          console.log('Map container already initialized, skipping...')
          return
        }

        // Determine initial center - use delivery location if available, otherwise default to Bangalore
        let initialCenter = [12.9716, 77.5946] // Default: Bangalore
        let initialZoom = 13
        
        if (trackingData) {
          if (trackingData.deliveryLocation && trackingData.deliveryLocation.lat && trackingData.deliveryLocation.lng) {
            initialCenter = [trackingData.deliveryLocation.lat, trackingData.deliveryLocation.lng]
            initialZoom = 12
          } else if (trackingData.pickupLocation && trackingData.pickupLocation.lat && trackingData.pickupLocation.lng) {
            initialCenter = [trackingData.pickupLocation.lat, trackingData.pickupLocation.lng]
            initialZoom = 12
          } else if (trackingData.currentLocation && trackingData.currentLocation.lat && trackingData.currentLocation.lng) {
            initialCenter = [trackingData.currentLocation.lat, trackingData.currentLocation.lng]
            initialZoom = 13
          }
        }
        
        // Initialize map
        console.log('Initializing Leaflet map...', mapRef.current, 'Center:', initialCenter)
        const map = window.L.map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          zoomControl: true,
          preferCanvas: false
        })

        // Add OpenStreetMap tiles
        const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        })
        
        tileLayer.on('tileerror', (error) => {
          console.error('Tile loading error:', error)
        })
        
        tileLayer.addTo(map)

        mapInstanceRef.current = map
        console.log('Map initialized successfully', map)

        // Trigger invalidateSize multiple times to ensure map renders
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
            console.log('Map size invalidated (first time)')
          }
        }, 100)
        
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
            console.log('Map size invalidated (second time)')
          }
        }, 500)

        // Always show the map, even without tracking data
        // If we have tracking data, update the map
        if (trackingData) {
          setTimeout(() => {
            if (mapInstanceRef.current) {
              updateMap(trackingData)
            }
          }, 200)
        } else {
          // Just ensure map is visible
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize()
            }
          }, 200)
        }
      } catch (mapError) {
        console.error('Error initializing map:', mapError)
        setError('Failed to initialize map: ' + mapError.message)
        setLoading(false)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100)

    // Cleanup function
    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded])

  // Update map when tracking data changes (separate effect)
  useEffect(() => {
    if (mapInstanceRef.current && trackingData && trackingData.currentLocation) {
      updateMap(trackingData)
    }
  }, [trackingData])

  // Update map with tracking data
  const updateMap = (data) => {
    if (!mapInstanceRef.current || !window.L) {
      // If map not ready, wait a bit and try again
      if (window.L && mapRef.current) {
        setTimeout(() => updateMap(data), 100)
      }
      return
    }

    const map = mapInstanceRef.current
    const L = window.L

    console.log('Updating map with data:', data)

    // Parse locations
    const currentLocation = data.currentLocation
    const pickupLocation = data.pickupLocation
    const deliveryLocation = data.deliveryLocation
    const locationHistory = data.locationHistory || []

    const bounds = []
    
    // If no locations at all, show default view
    if (!currentLocation && !pickupLocation && !deliveryLocation && locationHistory.length === 0) {
      console.log('No location data available, showing default map view')
      map.setView([12.9716, 77.5946], 13)
      return
    }

    // Add pickup location marker
    if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
      const pickupLatLng = [pickupLocation.lat, pickupLocation.lng]
      bounds.push(pickupLatLng)

      if (!markersRef.current.pickup) {
        // Create custom blue icon
        const blueIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })

        markersRef.current.pickup = L.marker(pickupLatLng, { icon: blueIcon })
          .addTo(map)
          .bindPopup(`<strong>Pickup Location</strong><br/>${pickupLocation.address || 'Pickup point'}`)
      }
    }

    // Add delivery location marker
    if (deliveryLocation && deliveryLocation.lat && deliveryLocation.lng) {
      const deliveryLatLng = [deliveryLocation.lat, deliveryLocation.lng]
      bounds.push(deliveryLatLng)

      if (!markersRef.current.delivery) {
        // Create custom green icon
        const greenIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #34A853; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })

        markersRef.current.delivery = L.marker(deliveryLatLng, { icon: greenIcon })
          .addTo(map)
          .bindPopup(`<strong>Delivery Location</strong><br/>${deliveryLocation.address || 'Delivery address'}`)
      }
    }

    // Add current location marker (delivery man)
    if (currentLocation && currentLocation.lat && currentLocation.lng) {
      const currentLatLng = [currentLocation.lat, currentLocation.lng]
      bounds.push(currentLatLng)

      // Remove old current location marker
      if (markersRef.current.current) {
        map.removeLayer(markersRef.current.current)
      }

      // Create custom red icon with arrow for heading
      const heading = currentLocation.heading || 0
      const redIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #EA4335; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: rotate(${heading}deg);">
                 <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%) rotate(180deg); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid #EA4335;"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      markersRef.current.current = L.marker(currentLatLng, { icon: redIcon })
        .addTo(map)
        .bindPopup(`<strong>Delivery Man Location</strong><br/>${currentLocation.address || 'Current location'}<br/><small>Updated: ${new Date(currentLocation.timestamp).toLocaleTimeString()}</small>`)
    }

    // Draw route polyline if we have location history
    if (locationHistory.length > 0) {
      const path = locationHistory.map(loc => [loc.lat, loc.lng])

      // Add current location to path if available
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        path.push([currentLocation.lat, currentLocation.lng])
      }

      // Remove old polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current)
      }

      // Create new polyline
      polylineRef.current = L.polyline(path, {
        color: '#EA4335',
        weight: 4,
        opacity: 0.8
      }).addTo(map)
    }

    // Draw route from current to delivery if we have both
    if (currentLocation && deliveryLocation && 
        currentLocation.lat && currentLocation.lng && 
        deliveryLocation.lat && deliveryLocation.lng) {
      
      // Remove old route if exists
      if (polylineRef.current && polylineRef.current.options.color === '#4285F4') {
        map.removeLayer(polylineRef.current)
      }

      // Draw route line
      const routePath = [
        [currentLocation.lat, currentLocation.lng],
        [deliveryLocation.lat, deliveryLocation.lng]
      ]

      polylineRef.current = L.polyline(routePath, {
        color: '#4285F4',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(map)
    }

    // Fit bounds to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
      console.log('Map bounds updated with', bounds.length, 'locations')
    } else {
      // If no bounds, ensure map is visible
      map.invalidateSize()
      console.log('No bounds to fit, invalidating map size')
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
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-700 font-semibold mb-2">Unable to load tracking</p>
          <p className="text-gray-600 text-sm">{error}</p>
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

  // Check if we have any location data
  const hasLocationData = trackingData.currentLocation || 
                         trackingData.pickupLocation || 
                         trackingData.deliveryLocation || 
                         (trackingData.locationHistory && trackingData.locationHistory.length > 0)

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
        <div 
          ref={mapRef} 
          id={`leaflet-map-${orderId}`}
          className="w-full h-96 rounded-lg shadow-lg" 
          style={{ 
            zIndex: 0,
            minHeight: '384px',
            height: '384px',
            width: '100%',
            backgroundColor: '#f3f4f6',
            position: 'relative'
          }} 
        />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
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

        {/* Message when no location data available - show as overlay but don't block map */}
        {!hasLocationData && leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg z-[500] pointer-events-none">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg pointer-events-auto max-w-md">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-700 font-semibold mb-2">Waiting for Location Updates</p>
              <p className="text-gray-600 text-sm mb-4">
                The delivery man hasn't shared their location yet.<br/>
                Location markers will appear once tracking begins.
              </p>
              <button
                onClick={async () => {
                  setGeneratingFake(true)
                  try {
                    await generateFakeLocations(orderId)
                    // Reload tracking data after generating fake locations
                    setTimeout(() => {
                      loadTrackingData()
                    }, 1000)
                  } catch (err) {
                    console.error('Error generating fake locations:', err)
                    alert('Failed to generate fake locations. Make sure the order is accepted by a delivery man.')
                  } finally {
                    setGeneratingFake(false)
                  }
                }}
                disabled={generatingFake}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                {generatingFake ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Test Locations
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">For testing purposes only</p>
            </div>
          </div>
        )}
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
