import React, { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';
import { defaultCoordination } from '../utils/helpers.js';

export default function Map({ currentCoord, markers, activeMarker, activeRestaurant }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // Validate center: MapLibre expects [longitude, latitude]
  const mapCenter = useMemo(() => {
    const rawCenter = activeMarker || currentCoord || defaultCoordination;
    if (Array.isArray(rawCenter) && typeof rawCenter[0] === 'number' && typeof rawCenter[1] === 'number' && !isNaN(rawCenter[0]) && !isNaN(rawCenter[1])) {
      return [rawCenter[1], rawCenter[0]]; // Convert [lat, lng] to [lng, lat]
    }
    return [defaultCoordination[1], defaultCoordination[0]];
  }, [activeMarker, currentCoord]);

  const safeMarkers = useMemo(() => {
    if (!Array.isArray(markers)) return [];
    return markers.filter(m => 
      m && 
      Array.isArray(m.position) && 
      typeof m.position[0] === 'number' && 
      typeof m.position[1] === 'number' && 
      !isNaN(m.position[0]) && 
      !isNaN(m.position[1])
    );
  }, [markers]);

  // 1. Initialize MapLibre GL Instance with OpenFreeMap Vector Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: mapCenter,
      zoom: 16,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Fly to active location on change
  useEffect(() => {
    if (mapRef.current && mapCenter) {
      try {
        mapRef.current.flyTo({
          center: mapCenter,
          zoom: 16,
          duration: 800,
          essential: true,
        });
      } catch (e) {
        console.warn("MapLibre flyTo error:", e);
      }
    }
  }, [mapCenter]);

  // 3. Update Restaurant Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous restaurant markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    safeMarkers.forEach(m => {
      const isSelected = m.name === activeRestaurant;
      
      const el = document.createElement('div');
      el.className = `map-marker-pin ${isSelected ? 'active-pin' : ''}`;
      el.innerHTML = isSelected ? '📍' : '📌';
      el.style.fontSize = isSelected ? '28px' : '20px';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';
      if (isSelected) {
        el.style.zIndex = '1000';
      }

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${m.name}</strong>`);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.position[1], m.position[0]])
        .setPopup(popup)
        .addTo(map);

      if (isSelected) {
        popup.addTo(map);
      }

      markersRef.current.push(marker);
    });
  }, [safeMarkers, activeRestaurant]);

  // 4. Update User Position Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (currentCoord && Array.isArray(currentCoord) && !isNaN(currentCoord[0]) && !isNaN(currentCoord[1])) {
      const el = document.createElement('div');
      el.innerHTML = '🚶';
      el.style.fontSize = '26px';
      el.style.cursor = 'pointer';

      const popup = new maplibregl.Popup({ offset: 25 }).setText('現在位置 / Current Position');

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([currentCoord[1], currentCoord[0]])
        .setPopup(popup)
        .addTo(map);
    }
  }, [currentCoord]);

  return (
    <div ref={mapContainerRef} className="map-container" style={{ width: '100%', height: '100%' }} />
  );
}
