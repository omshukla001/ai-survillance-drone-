import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Detection, DroneStatusData } from '../lib/types';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';

// Import types from Leaflet
import type { 
  Map as LeafletMapType, 
  LatLngTuple, 
  LayerGroup, 
  Marker as LeafletMarker,
  DivIcon,
} from 'leaflet';

// Declare module-level variables for Leaflet
let L: typeof import('leaflet') | null = null;

interface MapWrapperProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  onMarkerClick: (detection: Detection) => void;
  droneStatuses: Record<string, DroneStatusData>;
  onNewCoordinate?: (coord: { lat: number; lng: number }) => void;
}

interface MarkerRefs {
  [key: string]: LeafletMarker;
}

// Helper to get severity color based on people count
const getSeverityColor = (peopleCount: number): string => {
  if (peopleCount <= 3) return '#22c55e'; // Green
  if (peopleCount <= 10) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
};

// Helper to get severity class based on people count
const getSeverityClass = (peopleCount: number): string => {
  if (peopleCount <= 3) return 'low';
  if (peopleCount <= 10) return 'medium';
  return 'high';
};

const MapWrapper: React.FC<MapWrapperProps> = ({ 
  detections, 
  selectedDetection, 
  onMarkerClick, 
  droneStatuses,
  onNewCoordinate
}) => {
  // State
  const [isLeafletLoaded, setIsLeafletLoaded] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMapType | null>(null);
  const layerGroupRef = useRef<LayerGroup | null>(null);
  const detectionMarkersRef = useRef<MarkerRefs>({});
  const droneMarkersRef = useRef<MarkerRefs>({});
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Effect 1: Load Leaflet library
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadLeaflet = async () => {
      // Skip if already loaded
      if (L) {
        if (isMountedRef.current) {
          setIsLeafletLoaded(true);
        }
        return;
      }

      try {
        const leafletModule = await import('leaflet');
        
        if (!isMountedRef.current) return;

        L = leafletModule.default || leafletModule;
        
        // Fix for default marker icons in production
        if (L && L.Icon && L.Icon.Default) {
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          });
        }

        if (isMountedRef.current) {
          setIsLeafletLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    loadLeaflet();

    return () => {
      isMountedRef.current = false;
      // Cleanup geolocation watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Effect 2: Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!isLeafletLoaded || !L || !mapRef.current) return;

    const container = mapRef.current;

    // Check if map is already initialized on this container
    if (mapInstanceRef.current) {
      return;
    }

    try {
      // Default coordinates - Gautam Buddha University, Greater Noida
      const GBU_COORDS: LatLngTuple = [28.4504, 77.5446];
      const DEFAULT_ZOOM = 15;

      // Initialize the map
      const map = L.map(container, {
        zoomControl: false,
        preferCanvas: true,
        zoom: DEFAULT_ZOOM,
        center: GBU_COORDS
      });

      // Add zoom control to top-right
      L.control.zoom({
        position: 'topright'
      }).addTo(map);

      // Use satellite imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add labels overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        opacity: 0.8
      }).addTo(map);

      // Create layer group for markers
      const layerGroup = L.layerGroup().addTo(map);
      
      // Store references
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;
      
      if (isMountedRef.current) {
        setIsMapReady(true);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      layerGroupRef.current = null;
      detectionMarkersRef.current = {};
      droneMarkersRef.current = {};
      userMarkerRef.current = null;
    };
  }, [isLeafletLoaded]);

  // Real-time user location tracking
  const handleUserLocation = useCallback(() => {
    console.log('🎯 Starting real-time location tracking...');
    
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser.';
      console.warn('❌ Geolocation not supported');
      setLocationError(errorMsg);
      return;
    }

    if (!L || !mapInstanceRef.current || !layerGroupRef.current) {
      const errorMsg = 'Map not ready yet.';
      console.warn('❌ Map not ready for location tracking');
      setLocationError(errorMsg);
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    console.log('📍 Starting geolocation watch...');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMountedRef.current || !L || !mapInstanceRef.current || !layerGroupRef.current) {
          console.log('⚠️ Component unmounted or map not ready, skipping location update');
          return;
        }

        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = new Date(position.timestamp);
        
        console.log(`📡 Location Update:`, {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          accuracy: Math.round(accuracy),
          speed: speed ? Math.round(speed * 3.6) + ' km/h' : 'N/A',
          heading: heading ? Math.round(heading) + '°' : 'N/A',
          timestamp: timestamp.toLocaleTimeString()
        });

        const newLocation: LatLngTuple = [latitude, longitude];
        const newLocationData = { lat: latitude, lng: longitude, accuracy };

        if (userMarkerRef.current) {
          const currentPos = userMarkerRef.current.getLatLng();
          const distance = mapInstanceRef.current.distance(currentPos, newLocation);
          
          console.log(`📏 Distance moved: ${distance.toFixed(2)}m`);
          
          const threshold = Math.max(accuracy * 0.5, 10);
          
          if (distance > threshold) {
            console.log(`✅ Significant movement detected`);
            userMarkerRef.current.setLatLng(newLocation);
            setUserLocation(newLocationData);
            
            if (distance > 100) {
              console.log('🚁 Flying to new location');
              mapInstanceRef.current.flyTo(newLocation, 16, {
                duration: 1.5,
                animate: true
              });
            }
          } else {
            console.log(`⏭️ Minor movement`);
          }
          
          updateUserMarkerAccuracy(userMarkerRef.current, accuracy);
          
        } else {
          console.log('🎯 First location fix - creating user marker');
          
          mapInstanceRef.current.flyTo(newLocation, 16, {
            duration: 2,
            animate: true
          });

          const userIcon = L.divIcon({
            className: 'user-marker enhanced',
            html: `
              <div class="user-marker-container">
                <div class="user-marker-pulse"></div>
                <div class="user-marker-dot"></div>
                <div class="user-marker-accuracy" style="width: ${Math.max(accuracy * 2, 20)}px; height: ${Math.max(accuracy * 2, 20)}px;"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker(newLocation, { icon: userIcon })
            .addTo(layerGroupRef.current)
            .bindPopup(`
              <div class="marker-popup user-popup">
                <div class="popup-header">
                  <span class="popup-title">📍 Your Location</span>
                </div>
                <div class="popup-content">
                  <div class="popup-row">
                    <span class="popup-label">Accuracy:</span>
                    <span class="popup-value">±${Math.round(accuracy)}m</span>
                  </div>
                </div>
              </div>
            `);
          
          setUserLocation(newLocationData);
        }

        updateUserMarkerPopup(userMarkerRef.current, {
          accuracy,
          speed,
          heading,
          timestamp
        });

        setIsLocating(false);
      },
      (error: GeolocationPositionError) => {
        if (!isMountedRef.current) return;

        console.error('❌ Geolocation error:', error);
        
        let errorMessage = 'Unable to retrieve your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }

        setLocationError(errorMessage);
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([28.4504, 77.5446], 15);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );

    watchIdRef.current = watchId;
    console.log(`👀 Started geolocation watch with ID: ${watchId}`);

  }, []);

  const updateUserMarkerAccuracy = useCallback((marker: LeafletMarker, accuracy: number) => {
    if (!L) return;
    
    const icon = marker.getIcon() as DivIcon;
    const currentHtml = icon.options.html;
    
    if (typeof currentHtml === 'string') {
      const newHtml = currentHtml.replace(
        /width: \d+px; height: \d+px/,
        `width: ${Math.max(accuracy * 2, 20)}px; height: ${Math.max(accuracy * 2, 20)}px`
      );
      
      const newIcon = L.divIcon({
        ...icon.options,
        html: newHtml
      });
      marker.setIcon(newIcon);
    }
  }, []);

  const updateUserMarkerPopup = useCallback((marker: LeafletMarker, data: {
    accuracy: number;
    speed?: number | null;
    heading?: number | null;
    timestamp: Date;
  }) => {
    const popup = marker.getPopup();
    if (popup) {
      popup.setContent(`
        <div class="marker-popup user-popup">
          <div class="popup-header">
            <span class="popup-title">📍 Your Location</span>
            <span class="popup-status live">LIVE</span>
          </div>
          <div class="popup-content">
            <div class="popup-row">
              <span class="popup-label">Accuracy:</span>
              <span class="popup-value">±${Math.round(data.accuracy)}m</span>
            </div>
            <div class="popup-row">
              <span class="popup-label">Speed:</span>
              <span class="popup-value">${data.speed ? Math.round(data.speed * 3.6) + ' km/h' : 'Stationary'}</span>
            </div>
            ${data.heading ? `
            <div class="popup-row">
              <span class="popup-label">Heading:</span>
              <span class="popup-value">${Math.round(data.heading)}°</span>
            </div>
            ` : ''}
            <div class="popup-row">
              <span class="popup-label">Updated:</span>
              <span class="popup-value">${data.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      `);
    }
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      console.log(`🛑 Stopping geolocation watch ID: ${watchIdRef.current}`);
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLocating(false);
    }
  }, []);

  // Effect 3: Update detection markers
  useEffect(() => {
    if (!isMapReady || !L || !layerGroupRef.current) return;

    const currentDetectionIds = new Set(detections.map(d => String(d.id)));
    const newMarkersRef: MarkerRefs = {};

    // Remove markers for detections that no longer exist
    Object.entries(detectionMarkersRef.current).forEach(([id, marker]) => {
      if (!currentDetectionIds.has(id)) {
        layerGroupRef.current?.removeLayer(marker);
      } else {
        newMarkersRef[id] = marker;
      }
    });

    // Add or update detection markers
    detections.forEach(detection => {
      if (!detection.latitude || !detection.longitude || !detection.id) {
        return;
      }

      const position: LatLngTuple = [detection.latitude, detection.longitude];
      const severityColor = getSeverityColor(detection.peopleCount);
      const severityClass = getSeverityClass(detection.peopleCount);
      const detectionIdString = String(detection.id);

      if (newMarkersRef[detectionIdString]) {
        const existingMarker = newMarkersRef[detectionIdString];
        const currentPos = existingMarker.getLatLng();
        
        if (currentPos.lat !== detection.latitude || currentPos.lng !== detection.longitude) {
          existingMarker.setLatLng(position);
        }

        existingMarker.getPopup()?.setContent(`
          <div class="marker-popup detection-popup">
            <div class="popup-header" style="border-left: 3px solid ${severityColor}">
              <span class="popup-title">🚨 Detection #${detection.id}</span>
            </div>
            <div class="popup-content">
              <div class="popup-row">
                <span class="popup-label">People:</span>
                <span class="popup-value" style="color: ${severityColor}">${detection.peopleCount}</span>
              </div>
              <div class="popup-row">
                <span class="popup-label">Time:</span>
                <span class="popup-value">${new Date(detection.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        `);
      } else {
        if (!L) return;
        
        try {
          const icon = L.divIcon({
            className: `detection-marker ${severityClass}`,
            html: `
              <div class="detection-marker-container" style="--severity-color: ${severityColor}">
                <div class="detection-marker-pulse"></div>
                <div class="detection-marker-dot">
                  <span>${detection.peopleCount}</span>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          const marker = L.marker(position, { icon })
            .addTo(layerGroupRef.current!)
            .bindPopup(`
              <div class="marker-popup detection-popup">
                <div class="popup-header" style="border-left: 3px solid ${severityColor}">
                  <span class="popup-title">🚨 Detection #${detection.id}</span>
                </div>
                <div class="popup-content">
                  <div class="popup-row">
                    <span class="popup-label">People:</span>
                    <span class="popup-value" style="color: ${severityColor}">${detection.peopleCount}</span>
                  </div>
                </div>
              </div>
            `);

          marker.on('click', () => onMarkerClick(detection));
          newMarkersRef[detectionIdString] = marker;
        } catch (error) {
          console.error(`Error creating marker for detection ${detection.id}:`, error);
        }
      }
    });

    detectionMarkersRef.current = newMarkersRef;
  }, [isMapReady, detections, onMarkerClick]);

  // Effect 4: Update drone markers
  useEffect(() => {
    if (!isMapReady || !L || !layerGroupRef.current) return;

    const currentDroneIds = new Set(Object.keys(droneStatuses));
    const newMarkersRef: MarkerRefs = {};

    // Remove markers for drones that no longer exist
    Object.entries(droneMarkersRef.current).forEach(([id, marker]) => {
      if (!currentDroneIds.has(id)) {
        layerGroupRef.current?.removeLayer(marker);
      } else {
        newMarkersRef[id] = marker;
      }
    });

    // Add or update drone markers
    Object.entries(droneStatuses).forEach(([id, status]) => {
      if (!status?.lastLocation?.latitude || !status?.lastLocation?.longitude) {
        return;
      }

      const position: LatLngTuple = [status.lastLocation.latitude, status.lastLocation.longitude];
      const isActive = status.status !== 'offline';
      const droneType = id === 'drone_1' ? 'Scout' : 'Delivery';
      const droneEmoji = id === 'drone_1' ? '🔍' : '📦';

      if (newMarkersRef[id]) {
        const existingMarker = newMarkersRef[id];
        const currentPos = existingMarker.getLatLng();

        if (currentPos.lat !== position[0] || currentPos.lng !== position[1]) {
          existingMarker.setLatLng(position);
        }

        if (!L) return;
        
        const newIcon = L.divIcon({
          className: `drone-marker ${isActive ? 'active' : 'inactive'}`,
          html: `
            <div class="drone-marker-container ${isActive ? 'active' : 'inactive'}">
              <div class="drone-marker-icon">${droneEmoji}</div>
              ${isActive ? '<div class="drone-marker-pulse"></div>' : ''}
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });
        existingMarker.setIcon(newIcon);
      } else {
        if (!L) return;
        
        try {
          const icon = L.divIcon({
            className: `drone-marker ${isActive ? 'active' : 'inactive'}`,
            html: `
              <div class="drone-marker-container ${isActive ? 'active' : 'inactive'}">
                <div class="drone-marker-icon">${droneEmoji}</div>
                ${isActive ? '<div class="drone-marker-pulse"></div>' : ''}
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          });

          const marker = L.marker(position, { icon })
            .addTo(layerGroupRef.current!)
            .bindPopup(`
              <div class="marker-popup drone-popup">
                <div class="popup-header">
                  <span class="popup-title">${droneEmoji} ${droneType} Drone</span>
                </div>
              </div>
            `);

          newMarkersRef[id] = marker;
        } catch (error) {
          console.error('Error creating drone marker:', error);
        }
      }
    });

    droneMarkersRef.current = newMarkersRef;
  }, [isMapReady, droneStatuses]);

  // Render loading state
  if (!isLeafletLoaded) {
    return (
      <div className="map-container">
        <div ref={mapRef} className="map" />
        {locationError && (
          <div className="map-error">
            <span>{locationError}</span>
          </div>
        )}
      </div>
    );
  }

  // Main render
  return (
    <div className="map-wrapper enhanced">
      <div ref={mapRef} className="map-container" />
      
      <button
        onClick={isLocating ? stopLocationTracking : handleUserLocation}
        className={`map-control-button location-button ${isLocating ? 'tracking' : ''}`}
        title={isLocating ? "Stop location tracking" : "Start location tracking"}
        disabled={!isMapReady}
      >
        {isLocating ? '⏸' : '📍'}
      </button>

      {userLocation && (
        <div className="location-status">
          <div className="location-accuracy">
            <span>📍 Tracking</span>
            <span>±{Math.round(userLocation.accuracy)}m</span>
          </div>
        </div>
      )}

      {locationError && (
        <div className="map-error-toast">
          <span>{locationError}</span>
          <button onClick={() => setLocationError(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default MapWrapper;