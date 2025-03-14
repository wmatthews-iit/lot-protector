'use client';

import AddressSearch from '@/components/AddressSearch';
import { db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import usePlacesAPI from '@/lib/usePlacesAPI';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Grid,
  rem,
  Text,
  Title,
} from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { Map } from '@vis.gl/react-google-maps';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Find() {
  const user = useUser();
  const router = useRouter();
  const [lots, setLots] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  const [spotUnsubscribe, setSpotUnsubscribe] = useState<any>();
  const [spotSnapshot, setSpotSnapshot] = useState<any>();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
      else router.push('/signin');
    }
    
    let ignore = false;
    
    (async () => {
      if (ignore || typeof(user) === 'string' || user.role !== 1) return;
      
      const newLots: any[] = [];
      const lotDocuments = await getDocs(query(collection(db, 'parking_lots'),
        where('manager_id', '==', user.uid)));
      
      lotDocuments.forEach((lotDocument) => {
        newLots.push({ id: lotDocument.id, ...lotDocument.data() });
      });
      
      setLots(newLots);
    })();
    
    return () => { ignore = true; };
  }, [user]);
  
  const [selectedLotID, setLotID] = useState<string>();
  const selectedLot = selectedLotID ? lots.find((lot) => lot.id === selectedLotID) : null;
  const [selectedAddress, setSelectedAddress] = useState<any>();
  const [searched, setSearched] = useState(false);
  const placesAPI = usePlacesAPI('live-map');
  
  const selectLot = (lotID: string) => {
    setLotID(lotID);
    if (spotUnsubscribe && lotID != spotUnsubscribe.lotID) spotUnsubscribe.unsubscribeFromSpot();
    if (!lotID) return;
    
    const unsubscribeFromSpot = onSnapshot(query(collection(db, 'parking_spots'),
      where('lot_id', '==', lotID), where('occupied', '==', false)),
      (querySnapshot) => setSpotSnapshot(querySnapshot), (error) => console.log(error));
    
    setSpotUnsubscribe({ lotID, unsubscribeFromSpot });
  };
  
  useEffect(() => {
    if (!spotSnapshot) return;
    const newSpots: any[] = [];
    
    spotSnapshot.forEach((spotDocument: any) => {
      const spot = { id: spotDocument.id, ...spotDocument.data() };
      const zone = selectedLot.zones.find((z: any) => z.id == spot.zone_id);
      if (zone) spot.zone = zone.name;
      newSpots.push(spot);
    });
    
    setSpots(newSpots);
  }, [spotSnapshot]);
  
  useEffect(() => setSearched(false), [selectedAddress]);
  
  const searchForLot = async () => {
    try {
      if (!selectedAddress || !placesAPI || typeof(user) === 'string') return;
      
      placesAPI.getDetails({ placeId: selectedAddress.place_id }, async (result) => {
        if (!result) return;
        const { formatted_address } = result;
        
        try {
          const lotDocuments = await getDocs(query(collection(db, 'parking_lots'),
            where('address', '==', formatted_address)));
          const newLots: any[] = [];
          
          if (!lotDocuments.empty) {
            const lotDocument = lotDocuments.docs[0];
            newLots.push({ id: lotDocument.id, ...lotDocument.data() });
          }
          
          setLots(newLots);
          setSearched(true);
        } catch (error) {
          console.log(error);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };
  
  return <>
    <Title
      mb="md"
      order={2}
    >Available Parking Spots{selectedLot ? ` for ${selectedLot.name}` : ''}</Title>
    <Box display={selectedLot || typeof(user) === 'string' || user.role == 1 ? 'none' : 'block'}>
      <Text mb="xs">Search for a parking lot by address</Text>
      <AddressSearch
        selectedAddress={selectedAddress}
        setSelectedAddress={setSelectedAddress}
      />
      <Button
        disabled={!selectedAddress || selectedAddress.length === 0}
        my="md"
        onClick={searchForLot}
      >Search</Button>
      <Text
        display={searched && lots.length === 0 ? 'flex' : 'none'}
        mb="md"
      >No parking lots with that address</Text>
    </Box>
    <Button
      display={selectedLot ? 'block' : 'none'}
      mb="md"
      onClick={() => selectLot('')}
      variant="outline"
    >Back to Lots List</Button>
    <Map
      colorScheme="DARK"
      defaultCenter={{ lat: selectedLot ? selectedLot.location[0] : 41.83701364962227,
        lng: selectedLot ? selectedLot.location[1] : -87.6259816795722 }}
      defaultZoom={17}
      disableDefaultUI={true}
      gestureHandling="greedy"
      id="live-map"
      style={{ display: 'none' }}
    />
    <Grid display={selectedLot ? 'none' : 'flex'}>
      {(lots as any).sort((a: any, b: any) => a.name > b.name)
        .map((lot: any) => <Grid.Col
        key={lot.id}
        span={{ base: 12, md: 4 }}
      >
        <Card>
          <Map
            clickableIcons={false}
            colorScheme="DARK"
            defaultCenter={{ lat: lot.location[0], lng: lot.location[1] }}
            defaultZoom={17}
            disableDefaultUI={true}
            gestureHandling="none"
            style={{ width: '100%', height: '300px' }}
          />
          <Grid
            align="center"
            mt="md"
          >
            <Grid.Col span="auto">
              <Title order={3}>{lot.name}</Title>
              <Text>{lot.address}</Text>
            </Grid.Col>
            <Grid.Col
              h={rem(44)}
              span="content"
            >
              <ActionIcon onClick={() => selectLot(lot.id)}>
                <IconEye />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        </Card>
      </Grid.Col>)}
    </Grid>
    
    <Text display={selectedLot && spots && spots.length === 0 ? 'flex' : 'none'}>No spots available</Text>
    
    <Grid display={selectedLot ? 'flex' : 'none'}>
      {(spots as any)?.sort((a: any, b: any) => a.zone.localeCompare(b.zone) || a.number - b.number)
        .map((spot: any) => {
        return <Grid.Col
          key={spot.id}
          span={{ base: 12, md: 3 }}
        >
          <Card>
            <Grid>
              <Grid.Col span={6}>
                <Text fw="bold">{spot.zone}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text>Spot {spot.number}</Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>;
      })}
    </Grid>
  </>;
}
