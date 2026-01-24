package com.sudharshini.stockmanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

/**
 * Google Maps Service - Handles Google Maps API integration for route calculation
 */
@Service
public class GoogleMapsService {
    
    @Value("${google.maps.api.key:}")
    private String apiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Get route information between two points
     * @param originLat Origin latitude
     * @param originLng Origin longitude
     * @param destLat Destination latitude
     * @param destLng Destination longitude
     * @return Route information including distance and duration
     */
    public Map<String, Object> getRoute(double originLat, double originLng, double destLat, double destLng) {
        if (apiKey == null || apiKey.isEmpty()) {
            // Return mock data if API key is not configured
            return getMockRoute(originLat, originLng, destLat, destLng);
        }
        
        try {
            String url = UriComponentsBuilder.fromHttpUrl("https://maps.googleapis.com/maps/api/directions/json")
                    .queryParam("origin", originLat + "," + originLng)
                    .queryParam("destination", destLat + "," + destLng)
                    .queryParam("key", apiKey)
                    .toUriString();
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && "OK".equals(response.get("status"))) {
                return extractRouteInfo(response);
            }
        } catch (Exception e) {
            System.err.println("Error calling Google Maps API: " + e.getMessage());
        }
        
        // Fallback to mock data
        return getMockRoute(originLat, originLng, destLat, destLng);
    }
    
    /**
     * Geocode pincode to get coordinates
     * Uses OpenStreetMap Nominatim API (free, no API key needed)
     */
    public Map<String, Object> geocodePincode(String pincode, String countryCode) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Use Nominatim API (OpenStreetMap) - free and no API key required
            String url = "https://nominatim.openstreetmap.org/search";
            String query = pincode;
            
            // For India, add country code
            if (countryCode == null || countryCode.isEmpty()) {
                countryCode = "IN"; // Default to India
            }
            
            String fullQuery = pincode + ", " + countryCode;
            
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("q", fullQuery)
                    .queryParam("format", "json")
                    .queryParam("limit", "1")
                    .queryParam("addressdetails", "1");
            
            RestTemplate restTemplate = new RestTemplate();
            restTemplate.getInterceptors().add((request, body, execution) -> {
                request.getHeaders().add("User-Agent", "Sudharshini-Stock-Management/1.0");
                return execution.execute(request, body);
            });
            
            java.util.List<Map<String, Object>> response = restTemplate.getForObject(builder.toUriString(), java.util.List.class);
            
            if (response != null && !response.isEmpty()) {
                Map<String, Object> location = response.get(0);
                String lat = (String) location.get("lat");
                String lon = (String) location.get("lon");
                
                if (lat != null && lon != null) {
                    result.put("success", true);
                    result.put("lat", Double.parseDouble(lat));
                    result.put("lng", Double.parseDouble(lon));
                    result.put("address", location.get("display_name"));
                    result.put("pincode", pincode);
                    return result;
                }
            }
        } catch (Exception e) {
            System.err.println("Error geocoding pincode " + pincode + ": " + e.getMessage());
        }
        
        // Fallback: Return approximate coordinates for India (center of country)
        // This is a fallback - actual pincode lookup would be better
        result.put("success", false);
        result.put("lat", 20.5937); // Approximate center of India
        result.put("lng", 78.9629);
        result.put("address", "India");
        result.put("pincode", pincode);
        result.put("note", "Using approximate location - pincode lookup failed");
        
        return result;
    }
    
    /**
     * Geocode address string to get coordinates
     */
    public Map<String, Object> geocodeAddress(String address) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String url = "https://nominatim.openstreetmap.org/search";
            
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("q", address)
                    .queryParam("format", "json")
                    .queryParam("limit", "1")
                    .queryParam("addressdetails", "1");
            
            RestTemplate restTemplate = new RestTemplate();
            restTemplate.getInterceptors().add((request, body, execution) -> {
                request.getHeaders().add("User-Agent", "Sudharshini-Stock-Management/1.0");
                return execution.execute(request, body);
            });
            
            java.util.List<Map<String, Object>> response = restTemplate.getForObject(builder.toUriString(), java.util.List.class);
            
            if (response != null && !response.isEmpty()) {
                Map<String, Object> location = response.get(0);
                String lat = (String) location.get("lat");
                String lon = (String) location.get("lon");
                
                if (lat != null && lon != null) {
                    result.put("success", true);
                    result.put("lat", Double.parseDouble(lat));
                    result.put("lng", Double.parseDouble(lon));
                    result.put("address", location.get("display_name"));
                    return result;
                }
            }
        } catch (Exception e) {
            System.err.println("Error geocoding address " + address + ": " + e.getMessage());
        }
        
        result.put("success", false);
        return result;
    }
    
    /**
     * Calculate distance between two points using Haversine formula
     */
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // Earth's radius in kilometers
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distance in kilometers
    }
    
    /**
     * Extract route information from Google Maps API response
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> extractRouteInfo(Map<String, Object> response) {
        Map<String, Object> routeInfo = new HashMap<>();
        
        try {
            if (response.containsKey("routes") && ((java.util.List<?>) response.get("routes")).size() > 0) {
                Map<String, Object> route = (Map<String, Object>) ((java.util.List<?>) response.get("routes")).get(0);
                
                if (route.containsKey("legs") && ((java.util.List<?>) route.get("legs")).size() > 0) {
                    Map<String, Object> leg = (Map<String, Object>) ((java.util.List<?>) route.get("legs")).get(0);
                    
                    Map<String, Object> distance = (Map<String, Object>) leg.get("distance");
                    Map<String, Object> duration = (Map<String, Object>) leg.get("duration");
                    
                    routeInfo.put("distance", distance.get("value")); // in meters
                    routeInfo.put("distanceText", distance.get("text"));
                    routeInfo.put("duration", duration.get("value")); // in seconds
                    routeInfo.put("durationText", duration.get("text"));
                    
                    // Extract polyline for route path
                    if (route.containsKey("overview_polyline")) {
                        Map<String, Object> polyline = (Map<String, Object>) route.get("overview_polyline");
                        routeInfo.put("polyline", polyline.get("points"));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting route info: " + e.getMessage());
        }
        
        return routeInfo;
    }
    
    /**
     * Get mock route data when API key is not available
     */
    private Map<String, Object> getMockRoute(double originLat, double originLng, double destLat, double destLng) {
        double distance = calculateDistance(originLat, originLng, destLat, destLng);
        int distanceMeters = (int) (distance * 1000);
        int durationSeconds = (int) (distance * 60); // Assume 1 km per minute average speed
        
        Map<String, Object> routeInfo = new HashMap<>();
        routeInfo.put("distance", distanceMeters);
        routeInfo.put("distanceText", String.format("%.1f km", distance));
        routeInfo.put("duration", durationSeconds);
        routeInfo.put("durationText", String.format("%d min", durationSeconds / 60));
        
        return routeInfo;
    }
    
    /**
     * Get Google Maps API key (for frontend use)
     */
    public String getApiKey() {
        return apiKey;
    }
}
