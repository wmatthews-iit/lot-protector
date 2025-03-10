'use client';

import { db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Grid,
  Image,
  Modal,
  Paper,
  rem,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEye } from '@tabler/icons-react';
import { AdvancedMarker, Map, Pin, useMap } from '@vis.gl/react-google-maps';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Live() {
  const user = useUser();
  const router = useRouter();
  const [lots, setLots] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  const [spotUnsubscribe, setSpotUnsubscribe] = useState<any>();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [spotSnapshot, setSpotSnapshot] = useState<any>();
  const [alertSnapshot, setAlertSnapshot] = useState<any>();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
      else router.push('/signin');
    } else if (user.role !== 1) router.push('/find');
    
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
  
  const liveMap = useMap('live-map');
  const [selectedLotID, setLotID] = useState<string>();
  const selectedLot = selectedLotID ? lots.find((lot) => lot.id === selectedLotID) : null;
  const [selectedSpotID, setSelectedSpotID] = useState<string>();
  const selectedSpot = spots?.find((spot) => spot.id === selectedSpotID);
  const selectedZone = selectedSpot
    ? selectedLot.zones.find((zone: any) => zone.id == selectedSpot.zone_id) : null;
  const [showValid, setShowValid] = useState<boolean>(true);
  const [showDowned, setShowDowned] = useState<boolean>(true);
  const [selectedID, selectAlert] = useState<string>();
  const selectedAlert = selectedID ? alerts.find((alert) => alert.id === selectedID) : null;
  // const selectedZone = selectedAlert ? zones[selectedAlert.zone] : null;
  const [viewOpened, { toggle: toggleView, close: closeView }] = useDisclosure(false);
  
  const selectLot = (lotID: string) => {
    setLotID(lotID);
    
    if (spotUnsubscribe && lotID != spotUnsubscribe.lotID) {
      spotUnsubscribe.unsubscribeFromSpot();
      spotUnsubscribe.unsubscribeFromAlerts();
    }
    
    if (!lotID) return;
    
    const unsubscribeFromSpot = onSnapshot(query(collection(db, 'parking_spots'),
      where('lot_id', '==', lotID)), (querySnapshot) => setSpotSnapshot(querySnapshot), (error) => console.log(error));
    
    const unsubscribeFromAlerts = onSnapshot(query(collection(db, 'alerts'),
      where('lot_id', '==', lotID)), (querySnapshot) => setAlertSnapshot(querySnapshot),
      (error) => console.log(error));
    
    setSpotUnsubscribe({ lotID, unsubscribeFromSpot, unsubscribeFromAlerts });
  };
  
  useEffect(() => {
    if (!spotSnapshot) return;
    const newSpots: any[] = [...spots];
    
    spotSnapshot.forEach((spotDocument: any) => {
      const oldSpot = newSpots.findIndex((spot) => spot.id == spotDocument.id);
      if (oldSpot >= 0) newSpots.splice(oldSpot, 1);
      newSpots.push({ id: spotDocument.id, ...spotDocument.data() });
    });
    
    setSpots(newSpots);
  }, [spotSnapshot]);
  
  useEffect(() => {
    if (!alertSnapshot) return;
    const newAlerts: any[] = [...alerts];
    
    alertSnapshot.forEach((alertDocument: any) => {
      const oldAlert = newAlerts.findIndex((alert) => alert.id == alertDocument.id);
      if (oldAlert >= 0) newAlerts.splice(oldAlert, 1);
      const newAlert: any = { id: alertDocument.id, ...alertDocument.data(),
        time: alertDocument.get('time').toDate() };
      const spot = spots.find((s) => s.id === newAlert.spot_id);
      const zone = selectedLot.zones.find((z: any) => z.id == spot.zone_id);
      newAlert.spot = spot.number;
      newAlert.zone = zone.name;
      newAlert.address = zone.address;
      newAlerts.push(newAlert);
    });
    
    setAlerts(newAlerts);
  }, [alertSnapshot]);
  
  const selectSpot = (spot: any) => {
    if (!spot) return;
    setSelectedSpotID(spot.id);
    liveMap?.panTo({ lat: spot.location[0], lng: spot.location[1] });
    liveMap?.setZoom(20);
  };
  
  const downed = (spot: any) => {
    if (!spot) return true;
    return Date.now() - spot.last_working.toDate().getTime() > 60 * 60 * 1000;
  };
  
  const getPin = (spot: any) => {
    if (!spot) return null;
    if (spot.id == selectedSpotID) return <Pin background={'#40c057'} glyphColor={'#fff'} borderColor={'#37b24d'} />;
    if (downed(spot)) return <Pin background={'#868e96'} glyphColor={'#fff'} borderColor={'#495057'} />;
    if (spot.violation) return <Pin background={'#fa5252'} glyphColor={'#fff'} borderColor={'#f03e3e'} />;
    return <Pin background={'#228be6'} glyphColor={'#fff'} borderColor={'#1c7ed6'} />;
  };
  
  const viewAlert = (alert: any) => {
    selectAlert(alert.id);
    toggleView();
    selectSpot(spots.find((spot) => spot.id == alert.spot_id));
  };
  
  const formatTime = (time: Date) => {
    let hours = time.getHours();
    const isAM = hours < 12;
    if (hours === 0) hours += 12;
    else if (hours > 12) hours -= 12;
    
    return `${hours.toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')} ${isAM ? 'AM' : 'PM'}`;
  };
  
  return <>
    <Title
      mb="md"
      order={2}
    >Live Alerts{selectedLot ? ` for ${selectedLot.name}` : ''}</Title>
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
    
    <Grid display={selectedLot ? 'flex' : 'none'}>
      <Grid.Col
        h="calc(100vh - 60px - 16px)"
        span={{ base: 12, md: 8 }}
      >
        <Map
          colorScheme="DARK"
          defaultCenter={{ lat: selectedLot ? selectedLot.location[0] : 41.83701364962227,
            lng: selectedLot ? selectedLot.location[1] : -87.6259816795722 }}
          defaultZoom={17}
          disableDefaultUI={true}
          gestureHandling="greedy"
          id="live-map"
          mapId="4da06a36742951f0"
          style={{ width: '100%', height: 'calc(100vh - 60px - 32px)' }}
        >
          {spots?.filter((spot: any) => (spot.violation || showValid) && (!downed(spot) || showDowned))
            .map((spot: any) => <AdvancedMarker
            key={spot.id}
            onClick={() => selectSpot(spot)}
            position={{ lat: spot.location[0], lng: spot.location[1] }}
          >
            {getPin(spot)}
          </AdvancedMarker>)}
        </Map>
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper
          display={selectedSpotID ? 'block' : 'none'}
          mb="md"
          p="md"
          withBorder
        >
          <Title order={2}>{selectedZone?.name} - Spot {selectedSpot?.number}</Title>
          <Text mt="md">{selectedSpot?.occupied ? 'Occupied' : 'Empty'}
            {selectedSpot?.occupied ? `, ${(selectedSpot.violation ? '' : 'no ')}violation` : ''}</Text>
          <Text mt="md">Status: {selectedSpot ? (downed(selectedSpot) ? 'Down' : 'Working') : ''}</Text>
          <Text>Battery: {selectedSpot ? (selectedSpot.battery * 100).toFixed(2) : 0}%</Text>
          <Button
            onClick={() => setSelectedSpotID('')}
            mt="md"
            variant="outline"
          >Close</Button>
        </Paper>
        
        <Paper
          mb="md"
          p="md"
          withBorder
        >
          <Title order={2}>Settings</Title>
          <Checkbox
            checked={showValid}
            description="If unchecked, only sensors that are currently detecting violations will be shown. If checked, sensors with no cars or valid cars will be shown"
            label="Show Valid Sensors"
            mt="md"
            onChange={(event) => setShowValid(event.currentTarget.checked)}
          />
          <Checkbox
            checked={showDowned}
            description="A sensor is downed if it ran out of battery or if it's not working"
            label="Show Downed Sensors"
            mt="sm"
            onChange={(event) => setShowDowned(event.currentTarget.checked)}
          />
        </Paper>
        
        <Paper
          p="md"
          withBorder
        >
          <Title
            mb="md"
            order={2}
          >Alerts</Title>
          <Stack>
            {alerts
              .sort((a, b) => b.time.getTime() - a.time.getTime())
              .map((alert) => {
              return <Card key={alert.id}>
                <Grid align="center">
                  <Grid.Col span="auto">
                    <Text fw="bold">{alert.zone} - Spot {alert.spot}</Text>
                    <Text>{alert.address}</Text>
                    <Text>{formatTime(alert.time)}</Text>
                  </Grid.Col>
                  <Grid.Col
                    h={rem(44)}
                    span="content"
                  >
                    <ActionIcon onClick={() => viewAlert(alert)}>
                      <IconEye />
                    </ActionIcon>
                  </Grid.Col>
                </Grid>
              </Card>;
            })}
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
    
    <Modal
      centered
      onClose={closeView}
      opened={viewOpened}
      title="View Alert"
      zIndex={1400}
    >
      <Title order={4}>{selectedAlert?.zone} - Spot {selectedAlert?.spot}</Title>
      <Text mb="md">{selectedAlert?.address}</Text>
      <Text>Violation occurred at {selectedAlert ? formatTime(selectedAlert.time) : ''} by someone with the license plate: <strong>{selectedAlert?.license_plate}</strong></Text>
      <Image
        mt="md"
        src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-10.png"
      />
    </Modal>
  </>;
}
