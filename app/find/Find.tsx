'use client';

import { db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import {
  ActionIcon,
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
  
  const selectLot = (lotID: string) => {
    setLotID(lotID);
    if (spotUnsubscribe && lotID != spotUnsubscribe.lotID) spotUnsubscribe.unsubscribeFromSpot();
    if (!lotID) return;
    
    const unsubscribeFromSpot = onSnapshot(query(collection(db, 'parking_spots'),
      where('lot_id', '==', lotID), where('occupied', '==', false)), (querySnapshot) => setSpotSnapshot(querySnapshot), (error) => console.log(error));
    
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
  
  return <>
    <Title
      mb="md"
      order={2}
    >Available Parking Spots{selectedLot ? ` for ${selectedLot.name}` : ''}</Title>
    <Button
      display={selectedLot ? 'block' : 'none'}
      mb="md"
      onClick={() => selectLot('')}
      variant="outline"
    >Back to Lots List</Button>
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
