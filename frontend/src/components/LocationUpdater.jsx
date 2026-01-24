import { useEffect, useState } from 'react'
import { updateDeliveryLocation } from '../services/api'

/**
 * Location Updater Component
 * Allows delivery man to update their real-time location
 */
export default function LocationUpdater({ orderId, onLocationUpdate }) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [error, setError] = useState(null)
  const [watchId, setWatchId] = useState(null)
  const [updateInterval, setUpdateInterval] = useState(null)

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsTracking(true)
    setError(null)

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position)
      },
      (err) => {
        setError('Failed to get location: ' + err.message)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    // Watch position changes
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading
        })
      },
      (err) => {
        console.error('Location watch error:', err)
        setError('Location tracking error: ' + err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    setWatchId(id)

    // Update location to server every 5 seconds
    const interval = setInterval(() => {
      if (currentLocation) {
        updateLocationToServer(currentLocation)
      }
    }, 5000)

    setUpdateInterval(interval)
  }

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false)
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    if (updateInterval !== null) {
      clearInterval(updateInterval)
      setUpdateInterval(null)
    }
  }

  // Update location to server
  const updateLocationToServer = async (location) => {
    try {
      // Reverse geocode to get address
      let address = ''
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`
        )
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          address = data.results[0].formatted_address
        }
      } catch (e) {
        console.error('Geocoding error:', e)
      }

      const locationData = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        address: address
      }

      await updateDeliveryLocation(orderId, locationData)
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData)
      }
    } catch (error) {
      console.error('Error updating location:', error)
      setError('Failed to update location: ' + (error.response?.data?.error || error.message))
    }
  }

  // Update location from position
  const updateLocation = (position) => {
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading
    }
    setCurrentLocation(location)
    updateLocationToServer(location)
  }

  // Manual location update
  const handleManualUpdate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position)
      },
      (err) => {
        setError('Failed to get location: ' + err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (updateInterval !== null) {
        clearInterval(updateInterval)
      }
    }
  }, [watchId, updateInterval])

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Location Tracking</h3>
        <div className="flex items-center gap-2">
          {isTracking && (
            <span className="flex items-center text-green-600 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
              Tracking Active
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {currentLocation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">
            <strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}
          </p>
          {currentLocation.accuracy && (
            <p className="text-sm text-gray-600">
              <strong>Accuracy:</strong> {Math.round(currentLocation.accuracy)}m
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Stop Tracking
          </button>
        )}
        <button
          onClick={handleManualUpdate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Update Now
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {isTracking 
          ? 'Your location is being tracked and shared with the customer. Location updates every 5 seconds.'
          : 'Click "Start Tracking" to begin sharing your location in real-time.'}
      </p>
    </div>
  )
}
