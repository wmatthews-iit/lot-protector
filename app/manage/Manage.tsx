'use client';

import AddressSearch from '@/components/AddressSearch';
import { db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import usePlacesAPI from '@/lib/usePlacesAPI';
import lotValidation from '@/lib/validation/lot';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  rem,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconEye, IconSettings } from '@tabler/icons-react';
import { AdvancedMarker, Map, MapMouseEvent, Pin, useMap } from '@vis.gl/react-google-maps';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Manage() {
  const user = useUser();
  const router = useRouter();
  const [lots, setLots] = useState<any[]>([]);
  
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
      
      for (const lotDocument of lotDocuments.docs) {
        const { name, address, location, time_to_alert, next_zone, zones } = lotDocument.data();
        const loadedZones: any[] = [];
        
        for (const zone of zones) {
          const loadedZone = { ...zone, spots: [] };
          
          const spotDocuments = await getDocs(query(collection(db, 'parking_spots'),
            where('lot_id', '==', lotDocument.id), where('zone_id', '==', zone.id)));
          
          spotDocuments.forEach((spotDocument) => {
            const { number, location } = spotDocument.data();
            loadedZone.spots.push({ id: spotDocument.id, number, location });
          });
          
          loadedZones.push(loadedZone);
        }
        
        newLots.push({
          id: lotDocument.id,
          name,
          address,
          location,
          timeToAlert: time_to_alert,
          nextZone: next_zone,
          zones: loadedZones,
        });
      }
      
      setLots(newLots);
    })();
    
    return () => { ignore = true };
  }, [user]);
  
  const liveMap = useMap('live-map');
  const [selectedLotID, setLotID] = useState<string>();
  const selectedLot = selectedLotID ? lots.find((lot) => lot.id === selectedLotID) : null;
  const [selectedAddress, setSelectedAddress] = useState<any>();
  const placesAPI = usePlacesAPI('live-map');
  const [selectedZoneID, selectZone] = useState<string>();
  const selectedZone = selectedLot && selectedZoneID
    ? selectedLot.zones.find((zone: any) => zone.id == selectedZoneID) : null;
  const [createLotOpened, { toggle: toggleCreateLot, close: closeCreateLot }] = useDisclosure(false);
  const [createZoneOpened, { toggle: toggleCreateZone, close: closeCreateZone }] = useDisclosure(false);
  const [manageZoneOpened, { toggle: toggleManageZone, close: closeManageZone }] = useDisclosure(false);
  const [newSpotDetails, setSpotDetails] = useState<any>();
  const [selectedSpotID, setSelectedSpotID] = useState<string>();
  const [movingSpot, setMovingSpot] = useState<boolean>();
  const [newLocation, setNewLocation] = useState<number[]>();
  
  const lotForm = useForm({
    mode: 'controlled',
    initialValues: { name: '', timeToAlert: '5' },
    validate: { name: lotValidation.name, timeToAlert: lotValidation.timeToAlert },
  });
  
  const zoneForm = useForm({
    mode: 'controlled',
    initialValues: { name: '' },
    validate: lotValidation.zone,
  });
  
  const selectLot = (lotID: string) => {
    setLotID(lotID);
    resetLotEdit(lotID);
  };
  
  const showZone = (zone: any) => liveMap?.panTo({ lat: zone.location[0], lng: zone.location[1] });
  
  const openManageZone = (zone: any) => {
    selectZone(`${zone.id}`);
    resetZoneEdit(zone);
    toggleManageZone();
  };
  
  const createLot = ({ name, timeToAlert }: { name: string, timeToAlert: string }) => {
    if (!selectedAddress || !placesAPI || typeof(user) === 'string') return;
    
    placesAPI.getDetails({ placeId: selectedAddress.place_id }, async (result) => {
      if (!result) return;
      const { formatted_address, geometry } = result;
      if (!geometry) return;
      const { location } = geometry;
      if (!location) return;
      
      try {
        const lot: any = {
          manager_id: user.uid,
          name,
          address: formatted_address,
          location: [location.lat(), location.lng()],
          time_to_alert: Number(timeToAlert),
          next_zone: 0,
          zones: [],
        };
        
        const lotDocument = await addDoc(collection(db, 'parking_lots'), lot);
        
        lot.id = lotDocument.id;
        delete lot.manager_id;
        delete lot.time_to_alert;
        delete lot.next_zone;
        lot.timeToAlert = Number(timeToAlert);
        lot.nextZone = 0;
        setLots([...lots, lot]);
        closeCreateLot();
      } catch (error) {
        console.log(error);
      }
    });
  };
  
  const editLot = async ({ name, timeToAlert }: { name: string, timeToAlert: string }) => {
    if (typeof(user) === 'string' || !selectedLotID) return;
    
    try {
      await updateDoc(doc(db, 'parking_lots', selectedLotID), { name, time_to_alert: Number(timeToAlert) });
      const lot = { ...selectedLot, name, timeToAlert };
      setLots([...lots.filter((lot) => lot.id !== selectedLotID), lot]);
    } catch (error) {
      console.log(error);
    }
  };
  
  const deleteLot = async () => {
    if (typeof(user) === 'string' || !selectedLotID) return;
    
    try {
      const spotDocuments = await getDocs(query(collection(db, 'parking_spots'), where('lot_id', '==', selectedLotID)));
      
      for (const spotDocument of spotDocuments.docs) {
        await deleteDoc(spotDocument.ref);
      }
      
      const alertDocuments = await getDocs(query(collection(db, 'alerts'), where('lot_id', '==', selectedLotID)));
      
      for (const alertDocument of alertDocuments.docs) {
        await deleteDoc(alertDocument.ref);
      }
      
      await deleteDoc(doc(db, 'parking_lots', selectedLotID));
      
      setLots([...lots.filter((lot) => lot.id !== selectedLotID)]);
      selectLot('');
    } catch (error) {
      console.log(error);
    }
  };
  
  const resetLotEdit = (lotID?: string) => {
    if (!lotID) return;
    const lot = lots.find((lot) => lot.id === lotID);
    lotForm.setValues({ name: lot.name, timeToAlert: lot.timeToAlert });
  };
  
  const resetZoneEdit = (zone?: any) => {
    if (!zone) return;
    zoneForm.setValues({ name: zone.name });
    setSelectedAddress('');
  };
  
  const createZone = ({ name }: { name: string }) => {
    if (!selectedAddress || !placesAPI || typeof(user) === 'string'
      || !selectedLotID || !selectedLot) return;
    
    placesAPI.getDetails({ placeId: selectedAddress.place_id }, async (result) => {
      if (!result) return;
      const { formatted_address, geometry } = result;
      if (!geometry) return;
      const { location } = geometry;
      if (!location) return;
      
      try {
        const zone: any = {
          id: selectedLot.nextZone,
          name,
          address: formatted_address,
          location: [location.lat(), location.lng()],
          next_spot: 1,
          spots: [],
        };
        
        const updatedZone = { ...zone };
        delete updatedZone.spots;
        
        const otherZones = selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID);
        const updatedZones = [...otherZones.map((z: any) => {
          const newZone = { ...z };
          delete newZone.spots;
          return newZone;
        }), updatedZone];
        const zones = [...otherZones, zone];
        
        await updateDoc(doc(db, 'parking_lots', selectedLotID),
          { next_zone: selectedLot.nextZone + 1, zones: updatedZones });
        
        zone.spots = [];
        setLots([...lots.filter((lot) => lot.id !== selectedLotID),
          { ...selectedLot, nextZone: selectedLot.nextZone + 1, zones }]);
        closeCreateZone();
        zoneForm.reset();
      } catch (error) {
        console.log(error);
      }
    });
  };
  
  const updateZone = async ({ name }: { name: string }) => {
    if (!placesAPI || typeof(user) === 'string'
      || !selectedLotID || !selectedLot || !selectedZoneID || !selectedZone) return;
    
    if (selectedAddress) {
      placesAPI.getDetails({ placeId: selectedAddress.place_id }, async (result) => {
        if (!result) return;
        const { formatted_address, geometry } = result;
        if (!geometry) return;
        const { location } = geometry;
        if (!location) return;
        
        try {
          const zone: any = {
            ...selectedZone,
            name,
            address: formatted_address,
            location: [location.lat(), location.lng()],
          };
          
          const updatedZone = { ...zone };
          delete updatedZone.spots;
          
          const otherZones = selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID);
          const updatedZones = [...otherZones.map((z: any) => {
            const newZone = { ...z };
            delete newZone.spots;
            return newZone;
          }), updatedZone];
          const zones = [...otherZones, zone];
          
          await updateDoc(doc(db, 'parking_lots', selectedLotID), { zones: updatedZones });
          
          setLots([...lots.filter((lot) => lot.id !== selectedLotID),
            { ...selectedLot, zones }]);
        } catch (error) {
          console.log(error);
        }
      });
    } else {
      const zone: any = { ...selectedZone, name };
      const updatedZone = { ...zone };
      delete updatedZone.spots;
      
      const otherZones = selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID);
      const updatedZones = [...otherZones.map((z: any) => {
        const newZone = { ...z };
        delete newZone.spots;
        return newZone;
      }), updatedZone];
      const zones = [...otherZones, zone];
      
      await updateDoc(doc(db, 'parking_lots', selectedLotID), { zones: updatedZones });
      
      setLots([...lots.filter((lot) => lot.id !== selectedLotID),
        { ...selectedLot, zones }]);
    }
  };
  
  const deleteZone = async () => {
    if (!selectedLotID || !selectedLot || !selectedZoneID || !selectedZone) return;
    
    const otherZones = selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID);
    const updatedZones = [...otherZones.map((z: any) => {
      const newZone = { ...z };
      delete newZone.spots;
      return newZone;
    })];
    const zones = [...otherZones];
    
    await updateDoc(doc(db, 'parking_lots', selectedLotID), { zones: updatedZones });
    
    const spotDocuments = await getDocs(query(collection(db, 'parking_spots'), where('lot_id', '==', selectedLotID), where('zone_id', '==', Number(selectedZoneID))));
    
    for (const spotDocument of spotDocuments.docs) {
      await deleteDoc(spotDocument.ref);
      
      const alertDocuments = await getDocs(query(collection(db, 'alerts'), where('lot_id', '==', selectedLotID), where('spot_id', '==', spotDocument.id)));
      
      for (const alertDocument of alertDocuments.docs) {
        await deleteDoc(alertDocument.ref);
      }
    }
    
    setLots([...lots.filter((lot) => lot.id !== selectedLotID),
      { ...selectedLot, zones }]);
    closeManageZone();
  };
  
  const startCreatingSpot = () => {
    setSpotDetails({
      lot_id: selectedLotID,
      zone_id: Number(selectedZoneID),
      number: selectedZone.next_spot,
      location: [...selectedZone.location],
    });
    
    closeManageZone();
  };
  
  const onMapClick = (event: MapMouseEvent) => {
    if (!event.detail.latLng) return;
    
    if (newSpotDetails) {
      setSpotDetails({ ...newSpotDetails, location: [event.detail.latLng.lat, event.detail.latLng.lng] });
    } else if (movingSpot) {
      setNewLocation([event.detail.latLng.lat, event.detail.latLng.lng]);
    }
  };
  
  const createSpot = async () => {
    if (!selectedLotID) return;
    
    try {
      const spotDocument = await addDoc(collection(db, 'parking_spots'), {
        ...newSpotDetails,
        occupied: false,
        violation: false,
        last_working: new Date(),
        battery: 1.0,
      });
      
      const updatedZone = { ...selectedZone, next_spot: selectedZone.next_spot + 1 };
      delete updatedZone.spots;
      
      await updateDoc(doc(db, 'parking_lots', selectedLotID),
        { zones: [...selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID).map((z: any) => {
          const newZone = { ...z };
          delete newZone.spots;
          return newZone;
        }), updatedZone] });
      
      setSpotDetails(null);
      setLots([...lots.filter((lot) => lot.id !== selectedLotID),
        { ...selectedLot,
          zones: [...selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID),
            { ...selectedZone, next_spot: selectedZone.next_spot + 1, spots: [...selectedZone.spots, {
              id: spotDocument.id,
              number: newSpotDetails.number,
              location: newSpotDetails.location,
            }] }] }]);
      toggleManageZone();
    } catch (error) {
      console.log(error);
    }
  };
  
  const cancelSpotCreation = () => {
    setSpotDetails(null);
    toggleManageZone();
  };
  
  const getVisibleSpots = () => {
    if (!selectedLot) return;
    const visibleSpots: any[] = [];
    
    selectedLot.zones.forEach((zone: any) => {
      zone.spots?.forEach((spot: any) => {
        visibleSpots.push({
          id: spot.id,
          lot_id: selectedLotID,
          zone_id: zone.id,
          number: spot.number,
          location: spot.location,
        });
      });
    });
    
    return visibleSpots;
  };
  
  const selectedSpot = getVisibleSpots()?.find((spot) => spot.id === selectedSpotID);
  
  const selectSpot = (id: string) => {
    const spot = getVisibleSpots()?.find((spot) => spot.id === id);
    if (!spot) return;
    selectLot(spot.lot_id);
    selectZone(`${spot.zone_id}`);
    setSelectedSpotID(id);
    setNewLocation(spot.location);
    liveMap?.panTo({ lat: spot.location[0], lng: spot.location[1] });
    liveMap?.setZoom(20);
  };
  
  const showSpot = (spot: any) => {
    selectSpot(spot.id);
    closeManageZone();
  };
  
  const moveSpot = async () => {
    if (!selectedLotID || !selectedSpotID) return;
    
    try {
      await updateDoc(doc(db, 'parking_spots', selectedSpotID),
        { location: newLocation });
      
      setMovingSpot(false);
      setLots([...lots.filter((lot) => lot.id !== selectedLotID),
        { ...selectedLot,
          zones: [...selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID),
            { ...selectedZone,
              spots: [...selectedZone.spots.filter((spot: any) => spot.id !== selectedSpotID), {
                id: selectedSpotID,
                number: selectedSpot.number,
                location: newLocation,
              }] }] }]);
    } catch (error) {
      console.log(error);
    }
  };
  
  const cancelMoveSpot = () => {
    setMovingSpot(false);
    setNewLocation(selectedSpot.location);
  };
  
  const deleteSpot = async (spotID: string) => {
    if (!selectedLotID) return;
    
    try {
      await deleteDoc(doc(db, 'parking_spots', spotID));
      const alertDocuments = await getDocs(query(collection(db, 'alerts'), where('lot_id', '==', selectedLotID), where('spot_id', '==', spotID)));
      
      for (const alertDocument of alertDocuments.docs) {
        await deleteDoc(alertDocument.ref);
      }
      
      setLots([...lots.filter((lot) => lot.id !== selectedLotID),
        { ...selectedLot,
          zones: [...selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID),
            { ...selectedZone,
              spots: [...selectedZone.spots.filter((spot: any) => spot.id !== spotID)] }] }]);
      
      selectSpot('');
      closeManageZone();
    } catch (error) {
      console.log(error);
    }
  };
  
  return <>
    <Title
      mb="md"
      order={2}
    >{selectedLot ? selectedLot.name : 'Manage Parking Lots'}</Title>
    <Button
      display={selectedLot ? 'none' : 'block'}
      mb="md"
      onClick={toggleCreateLot}
    >Create Parking Lot</Button>
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
                <IconSettings />
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
          onClick={onMapClick}
          style={{ width: '100%', height: 'calc(100vh - 60px - 32px)' }}
        >
          <AdvancedMarker
            style={{ display: newSpotDetails ? undefined : 'none' }}
            key="new"
            position={{ lat: newSpotDetails ? newSpotDetails.location[0] : 41.83701364962227,
              lng: newSpotDetails ? newSpotDetails.location[1] : -87.6259816795722 }}
          >
            <Pin background={'#ffd43b'} glyphColor={'#fff'} borderColor={'#fcc419'} />
          </AdvancedMarker>
          
          {getVisibleSpots()?.map((spot: any) => <AdvancedMarker
            key={spot.id}
            onClick={() => selectSpot(spot.id)}
            position={spot.id === selectedSpotID && movingSpot && newLocation
              ? { lat: newLocation[0], lng: newLocation[1] }
              : { lat: spot.location[0], lng: spot.location[1] }}
          >
            {spot.id == selectedSpotID ? <Pin background={'#40c057'} glyphColor={'#fff'} borderColor={'#37b24d'} />
              : <Pin background={'#228be6'} glyphColor={'#fff'} borderColor={'#1c7ed6'} />}
          </AdvancedMarker>)}
        </Map>
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper
          display={newSpotDetails ? 'block' : 'none'}
          mb="md"
          p="md"
          withBorder
        >
          <Title order={2}>{selectedZone?.name} - New Spot {newSpotDetails?.number}</Title>
          <Group mt="md">
            <Button onClick={createSpot}>Confirm Create</Button>
            <Button
              onClick={cancelSpotCreation}
              variant="outline"
            >Cancel</Button>
          </Group>
        </Paper>
        
        <Paper
          display={!newSpotDetails && selectedSpotID ? 'block' : 'none'}
          mb="md"
          p="md"
          withBorder
        >
          <Title order={2}>{selectedZone?.name} - Spot {selectedSpot?.number}</Title>
          <Group mt="md">
            <Button
              display={movingSpot ? 'block' : 'none'}
              onClick={moveSpot}
            >Confirm Move</Button>
            <Button
              variant={movingSpot ? 'outline' : 'filled'}
              onClick={movingSpot ? cancelMoveSpot : () => setMovingSpot(true)}
            >{ movingSpot ? 'Cancel Move' : 'Move' }</Button>
            <Button
              onClick={() => setSelectedSpotID('')}
              display={movingSpot ? 'none' : 'block'}
              variant="outline"
            >Cancel</Button>
            <Button
              color="red"
              display={movingSpot ? 'none' : 'block'}
              onClick={() => deleteSpot(selectedSpotID!)}
              variant="outline"
            >Delete</Button>
          </Group>
        </Paper>
        
        <Paper
          mb="md"
          p="md"
          withBorder
        >
          <Title order={2}>Settings</Title>
          <form onSubmit={lotForm.onSubmit(editLot)}>
            <TextInput
              key={lotForm.key('name')}
              {...lotForm.getInputProps('name')}
              label="Name"
              mt="md"
            />
            <NumberInput
              key={lotForm.key('timeToAlert')}
              {...lotForm.getInputProps('timeToAlert')}
              defaultValue={5}
              description="How many minutes should an alert be sent after a violation is detected?"
              label="Time to Alert"
              min={1}
              mt="sm"
            />
            <Group mt="md">
              <Button
                disabled={lotForm.getValues().name === selectedLot?.name
                  && lotForm.getValues().timeToAlert == selectedLot?.timeToAlert}
                type="submit"
              >Update</Button>
              <Button
                disabled={lotForm.getValues().name === selectedLot?.name
                  && lotForm.getValues().timeToAlert == selectedLot?.timeToAlert}
                type="button"
                onClick={() => resetLotEdit(selectedLotID)}
                variant="outline"
              >Cancel</Button>
            </Group>
          </form>
        </Paper>
        
        <Paper
          mb="md"
          p="md"
          withBorder
        >
          <Group
            justify="space-between"
            mb="md"
          >
            <Title order={2}>Zones</Title>
            <Button onClick={toggleCreateZone}>Create</Button>
          </Group>
          <Stack>
            <Text display={selectedLot?.zones?.length ? 'none' : 'block'}>No zones yet, create one above!</Text>
            {selectedLot?.zones
              .sort((a: any, b: any) => a.name > b.name)
              .map((zone: any) => <Card key={zone.id}>
              <Grid align="center">
                <Grid.Col span="auto">
                  <Text fw="bold">{zone.name}</Text>
                  <Text>{zone.address}</Text>
                  <Text>{zone.spots?.length} Spot{zone.spots?.length !== 1 ? 's' : ''}</Text>
                </Grid.Col>
                <Grid.Col
                  h={rem(44)}
                  span="content"
                >
                  <ActionIcon
                    mr="md"
                    onClick={() => showZone(zone)}
                  >
                    <IconEye />
                  </ActionIcon>
                  <ActionIcon onClick={() => openManageZone(zone)}>
                    <IconSettings />
                  </ActionIcon>
                </Grid.Col>
              </Grid>
            </Card>)}
          </Stack>
        </Paper>
        
        <Paper
          p="md"
          withBorder
        >
          <Title order={2}>Danger Zone</Title>
          <Button
            color="red"
            mt="md"
            onClick={deleteLot}
            variant="outline"
          >Delete Lot</Button>
        </Paper>
      </Grid.Col>
    </Grid>
    
    <Modal
      centered
      onClose={closeCreateLot}
      opened={createLotOpened}
      title="Create Parking Lot"
      zIndex={1400}
    >
      <form onSubmit={lotForm.onSubmit(createLot)}>
        <TextInput
          key={lotForm.key('name')}
          {...lotForm.getInputProps('name')}
          label="Name"
          mb="sm"
        />
        <AddressSearch
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
        <NumberInput
          key={lotForm.key('timeToAlert')}
          {...lotForm.getInputProps('timeToAlert')}
          defaultValue={5}
          description="How many minutes should an alert be sent after a violation is detected?"
          label="Time to Alert"
          mt="sm"
          mb="md"
          min={1}
        />
        <Button type="submit">Create</Button>
      </form>
    </Modal>
    
    <Modal
      centered
      onClose={closeCreateZone}
      opened={createZoneOpened}
      title="Create Zone"
      zIndex={1400}
    >
      <form onSubmit={zoneForm.onSubmit(createZone)}>
        <TextInput
          key={zoneForm.key('name')}
          {...zoneForm.getInputProps('name')}
          label="Name"
          mb="sm"
        />
        <AddressSearch
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
        <Button
          mt="md"
          type="submit"
        >Create</Button>
      </form>
    </Modal>
    
    <Modal
      centered
      onClose={closeManageZone}
      opened={manageZoneOpened}
      title="Manage Zone"
      zIndex={1400}
    >
      <Title order={4}>{selectedZone?.name}</Title>
      <Text mb="md">{selectedZone?.address}</Text>
      <Title order={5}>Update Information</Title>
      <form onSubmit={zoneForm.onSubmit(updateZone)}>
        <TextInput
          key={zoneForm.key('name')}
          {...zoneForm.getInputProps('name')}
          label="Name"
          mb="sm"
        />
        <AddressSearch
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
        <Group mt="md">
          <Button
            disabled={zoneForm.getValues().name === selectedZone?.name}
            type="submit"
          >Update</Button>
          <Button
            disabled={zoneForm.getValues().name === selectedZone?.name}
            type="button"
            onClick={() => resetZoneEdit(selectedZone)}
            variant="outline"
          >Cancel</Button>
        </Group>
      </form>
      <Group
        justify="space-between"
        my="md"
      >
        <Title order={5}>Spots</Title>
        <Button onClick={startCreatingSpot}>Create</Button>
      </Group>
      <Stack>
        <Text display={selectedZone?.spots?.length ? 'none' : 'block'}>No spots yet, create one above!</Text>
        {selectedZone?.spots
          .sort((a: any, b: any) => a.number - b.number)
          .map((spot: any) => <Group
          justify="space-between"
          key={spot.number}
        >
          <Text>{spot.number}</Text>
          <Group>
            <Button onClick={() => showSpot(spot)}>View</Button>
            <Button
              color="red"
              onClick={() => deleteSpot(spot.id)}
              variant="outline"
            >Delete</Button>
          </Group>
        </Group>)}
      </Stack>
      <Title
        my="md"
        order={5}
      >Danger Zone</Title>
      <Button
        color="red"
        onClick={deleteZone}
        variant="outline"
      >Delete</Button>
    </Modal>
  </>;
}
