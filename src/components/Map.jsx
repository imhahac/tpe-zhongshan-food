import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import './Map.css';

// Fix Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const defaultCoord = [25.01744, 121.537372];

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function Map({ currentCoord, markers, activeMarker }) {
  const mapCenter = activeMarker || currentCoord || defaultCoord;

  const userIcon = new L.Icon({
    iconUrl: '/frontend/icon.png',
    iconSize: [32, 40],
  });

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
        <Marker key={idx} position={m.position}>
          <Popup>{m.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
