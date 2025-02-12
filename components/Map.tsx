'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

import { LatLngExpression } from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';

export default function Map({ position }: { position?: LatLngExpression }) {
  return (
      <MapContainer
        center={position}
        scrollWheelZoom={true}
        style={{ height: "calc(100vh - 60px - 32px)", width: "100%" }}
        zoom={17}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
  );
}
