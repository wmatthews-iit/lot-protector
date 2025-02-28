'use client';

import useAutocompleteAPI from '@/lib/useAutocompleteAPI';
import { Autocomplete } from '@mantine/core';
import { useState } from 'react';

export default function AddressSearch({ selectedAddress, setSelectedAddress }:
  { selectedAddress: any, setSelectedAddress: any }) {
  const autocompleteAPI = useAutocompleteAPI();
  const [address, setAddress] = useState<string>('');
  const [predictions, setPredictions] = useState<any[]>([]);
  
  const updatePredictions = async () => {
    try {
      if (address.length === 0) {
        setPredictions([]);
        return;
      }
      
      const placePredictions = await autocompleteAPI?.getPlacePredictions({ input: address });
      setPredictions(placePredictions ? placePredictions.predictions : []);
    } catch (error) {
      console.log(error);
    }
  };
  
  const selectAddress = (address: string) => {
    setAddress(address);
    setSelectedAddress(predictions.find((prediction) => prediction.description === address));
  }
  
  return <Autocomplete
    data={predictions.map((prediction) => prediction.description)}
    label="Address"
    value={address}
    onChange={selectAddress}
    onKeyUp={updatePredictions}
  />;
}
