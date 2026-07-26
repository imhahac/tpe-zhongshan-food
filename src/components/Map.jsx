import React, { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';
import { defaultCoordination } from '../utils/helpers.js';

export default function Map({ currentCoord, markers, activeMarker, activeRestaurant, handleCardClick }) {
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

  // 1. Initialize MapLibre GL Instance
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
    
    // Ensure map container dimensions match properly on load and resize
    map.on('load', () => {
      map.resize();
    });

    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    mapRef.current = map;

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Fly to active location on change
  useEffect(() => {
    if (mapRef.current && mapCenter) {
      try {
        mapRef.current.resize();
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

  // 3. Update Restaurant Markers with click handlers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous restaurant markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    safeMarkers.forEach(m => {
      const isSelected = m.name === activeRestaurant;
      
      const el = document.createElement('div');
      el.className = `map-marker-badge ${isSelected ? 'active-badge' : ''}`;
      el.innerHTML = `
        ${isSelected ? '<div class="active-pulse-ring"></div>' : ''}
        <span>${isSelected ? '🔥' : '🍽️'}</span>
      `;

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(`<strong>${m.name}</strong>`);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([m.position[1], m.position[0]])
        .setPopup(popup)
        .addTo(map);

      // Marker click handler: select card and scroll to view
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (m.row && handleCardClick) {
          handleCardClick(m.row);
          document.getElementById(`card-${m.row.Restaurant}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      if (isSelected) {
        popup.addTo(map);
      }

      markersRef.current.push(marker);
    });
  }, [safeMarkers, activeRestaurant, handleCardClick]);

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
      el.className = 'user-location-container';
      el.innerHTML = `
        <div class="user-pulse-ring"></div>
        <div class="user-location-dot"></div>
      `;

      const popup = new maplibregl.Popup({ offset: 15 }).setText('現在位置 / Current Position');

      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([currentCoord[1], currentCoord[0]])
        .setPopup(popup)
        .addTo(map);
    }
  }, [currentCoord]);

  return (
    <div ref={mapContainerRef} className="map-container" />
  );
}
