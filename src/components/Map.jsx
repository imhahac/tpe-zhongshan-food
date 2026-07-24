import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import './Map.css';
import { defaultCoordination } from '../utils/helpers.js';

// Resolve Leaflet module in both ESM and CJS bundle environments safely
const leafletObj = (L && L.Icon) ? L : ((L && L.default && L.default.Icon) ? L.default : L);

if (leafletObj && leafletObj.Icon && leafletObj.Icon.Default && leafletObj.Icon.Default.prototype) {
  try {
    delete leafletObj.Icon.Default.prototype._getIconUrl;
    leafletObj.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } catch (e) {
    console.warn("Leaflet default icon options error:", e);
  }
}

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
      try {
        map.flyTo(center, zoom, { duration: 0.5 });
      } catch (e) {
        console.warn("map.flyTo error:", e);
      }
    }
  }, [center, zoom, map]);
  return null;
}

export default function Map({ currentCoord, markers, activeMarker, activeRestaurant }) {
  const mapCenter = useMemo(() => {
    const rawCenter = activeMarker || currentCoord || defaultCoordination;
    if (Array.isArray(rawCenter) && typeof rawCenter[0] === 'number' && typeof rawCenter[1] === 'number' && !isNaN(rawCenter[0]) && !isNaN(rawCenter[1])) {
      return rawCenter;
    }
    return defaultCoordination;
  }, [activeMarker, currentCoord]);

  const activeIcon = useMemo(() => {
    if (!leafletObj || !leafletObj.Icon) return null;
    return new leafletObj.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }, []);

  const userIcon = useMemo(() => {
    if (!leafletObj || !leafletObj.Icon) return null;
    return new leafletObj.Icon({
      iconUrl: (import.meta.env.BASE_URL || '/') + 'icon.png',
      iconSize: [32, 40],
    });
  }, []);

  const defaultIcon = useMemo(() => {
    if (!leafletObj || !leafletObj.Icon || !leafletObj.Icon.Default) return null;
    return new leafletObj.Icon.Default();
  }, []);

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

  return (
    <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={true} className="leaflet-container">
      <TileLayer
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={mapCenter} zoom={16} />
      
      {currentCoord && Array.isArray(currentCoord) && !isNaN(currentCoord[0]) && !isNaN(currentCoord[1]) && (
        <Marker position={currentCoord} icon={userIcon || undefined}>
          <Popup>現在位置 / Current Position</Popup>
        </Marker>
      )}

      {safeMarkers.map((m, idx) => (
        <Marker 
          key={`${m.name}-${idx}`} 
          position={m.position}
          icon={m.name === activeRestaurant ? (activeIcon || undefined) : (defaultIcon || undefined)}
          zIndexOffset={m.name === activeRestaurant ? 1000 : 0}
        >
          <Popup>{m.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
