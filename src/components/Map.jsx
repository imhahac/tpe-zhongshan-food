import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import './Map.css';
import { defaultCoordination } from '../utils/helpers.js';

// Fix Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.5 });
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

export default function Map({ currentCoord, markers, activeMarker, activeRestaurant }) {
  const mapCenter = activeMarker || currentCoord || defaultCoordination;

  const userIcon = new L.Icon({
    iconUrl: import.meta.env.BASE_URL + 'icon.png',
    iconSize: [32, 40],
  });

  const defaultIcon = new L.Icon.Default();

  return (
    <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={true} className="leaflet-container">
      <TileLayer
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={mapCenter} zoom={16} />
      
      {currentCoord && (
        <Marker position={currentCoord} icon={userIcon}>
          <Popup>現在位置 / Current Position</Popup>
        </Marker>
      )}

      {markers.map((m, idx) => (
        <Marker 
          key={`${m.name}-${idx}`} 
          position={m.position}
          icon={m.name === activeRestaurant ? activeIcon : defaultIcon}
          zIndexOffset={m.name === activeRestaurant ? 1000 : 0}
        >
          <Popup>{m.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
