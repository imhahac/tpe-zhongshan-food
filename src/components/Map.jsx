import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { defaultCoordination } from '../utils/helpers.js';

// Fix default Leaflet icon paths in React ESM builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
      try {
        map.flyTo(center, zoom, { duration: 0.5 });
      } catch (e) {
        console.warn("Leaflet flyTo error:", e);
      }
    }
  }, [center, zoom, map]);
  return null;
}

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultIcon = new L.Icon.Default();

export default function Map({ currentCoord, markers, activeMarker, activeRestaurant, handleCardClick }) {
  const mapCenter = useMemo(() => {
    const rawCenter = activeMarker || currentCoord || defaultCoordination;
    if (Array.isArray(rawCenter) && typeof rawCenter[0] === 'number' && typeof rawCenter[1] === 'number' && !isNaN(rawCenter[0]) && !isNaN(rawCenter[1])) {
      return rawCenter;
    }
    return defaultCoordination;
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

  return (
    <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={true} className="leaflet-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={mapCenter} zoom={16} />
      
      {currentCoord && Array.isArray(currentCoord) && !isNaN(currentCoord[0]) && !isNaN(currentCoord[1]) && (
        <Marker position={currentCoord}>
          <Popup>現在位置 / Current Position</Popup>
        </Marker>
      )}

      {safeMarkers.map((m, idx) => (
        <Marker 
          key={`${m.name}-${idx}`} 
          position={m.position}
          icon={m.name === activeRestaurant ? activeIcon : defaultIcon}
          zIndexOffset={m.name === activeRestaurant ? 1000 : 0}
          eventHandlers={{
            click: () => {
              if (m.row && handleCardClick) {
                handleCardClick(m.row);
                document.getElementById(`card-${m.row.Restaurant}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }}
        >
          <Popup>{m.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
