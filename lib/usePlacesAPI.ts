'use client';

import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

export default function usePlacesAPI(id?: string) {
  const map = useMap(id);
  const placesLibrary = useMapsLibrary('places');
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  
  useEffect(() => {
    if (!placesLibrary || !map) return;
    setPlacesService(new placesLibrary.PlacesService(map));
  }, [placesLibrary, map]);
  
  return placesService;
}
