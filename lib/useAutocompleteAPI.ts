'use client';

import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

export default function useAutocompleteAPI() {
  const placesLibrary = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  
  useEffect(() => {
    if (!placesLibrary) return;
    setAutocompleteService(new placesLibrary.AutocompleteService());
  }, [placesLibrary]);

  return autocompleteService;
}
