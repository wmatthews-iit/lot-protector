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
import { Map, useMap } from '@vis.gl/react-google-maps';
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Manage() {
  const user = useUser();
  const router = useRouter();
  
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
          loadedZone.nextSpot = loadedZone.next_spot;
          delete loadedZone.next_spot;
          
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
  
  const [lots, setLots] = useState<any[]>([]);
  
  const liveMap = useMap('live-map')
  const [selectedLotID, setLotID] = useState<string>();
  const selectedLot = selectedLotID ? lots.find((lot) => lot.id === selectedLotID) : null;
  const [selectedAddress, setSelectedAddress] = useState<any>();
  const placesAPI = usePlacesAPI('search-map');
  const [selectedZoneID, selectZone] = useState<string>();
  const selectedZone = selectedLot && selectedZoneID
    ? selectedLot.zones.find((zone: any) => zone.id == selectedZoneID) : null;
  const [createLotOpened, { toggle: toggleCreateLot, close: closeCreateLot }] = useDisclosure(false);
  const [createZoneOpened, { toggle: toggleCreateZone, close: closeCreateZone }] = useDisclosure(false);
  const [manageZoneOpened, { toggle: toggleManageZone, close: closeManageZone }] = useDisclosure(false);
  
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
  
  const showSpot = (location: any) => {
    liveMap?.panTo({ lat: location[0], lng: location[1] });
    closeManageZone();
  }
  
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
          time_to_alert: timeToAlert,
          next_zone: 0,
          zones: [],
        };
        
        const lotDocument = await addDoc(collection(db, 'parking_lots'), lot);
        
        lot.id = lotDocument.id;
        delete lot.manager_id;
        delete lot.time_to_alert;
        delete lot.next_zone;
        lot.timeToAlert = timeToAlert;
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
        };
        
        const zones = [...selectedLot.zones, zone];
        
        await updateDoc(doc(db, 'parking_lots', selectedLotID),
          { next_zone: selectedLot.nextZone + 1, zones });
        
        delete zone.next_spot;
        zone.nextSpot = 1;
        zone.spots = [];
        setLots([...lots.filter((lot) => lot.id !== selectedLotID),
          { ...selectedLot, nextZone: selectedLot.nextZone + 1, zones }]);
        closeCreateZone();
      } catch (error) {
        console.log(error);
      }
    });
  }
  
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
          
          zone.next_spot = zone.nextSpot;
          delete zone.nextSpot;
          const zones = [...selectedLot.zones.filter((zone: any) => zone.id != selectedZoneID), zone];
          
          await updateDoc(doc(db, 'parking_lots', selectedLotID), { zones });
          
          zone.nextSpot = zone.next_spot;
          delete zone.next_spot;
          setLots([...lots.filter((lot) => lot.id !== selectedLotID),
            { ...selectedLot, zones }]);
        } catch (error) {
          console.log(error);
        }
      });
    } else {
      const zone: any = { ...selectedZone, name };
      zone.next_spot = zone.nextSpot;
      delete zone.nextSpot;
      const zones = [...selectedLot.zones.filter((zone: any) => zone.id !== selectedZoneID), zone];
      
      await updateDoc(doc(db, 'parking_lots', selectedLotID), { zones });
      
      zone.nextSpot = zone.next_spot;
      delete zone.next_spot;
      setLots([...lots.filter((lot) => lot.id !== selectedLotID),
        { ...selectedLot, zones }]);
    }
  }
  
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
    <Map
      defaultCenter={{ lat: 41.83701364962227, lng: -87.6259816795722 }}
      defaultZoom={17}
      disableDefaultUI={true}
      gestureHandling="greedy"
      id="search-map"
      style={{ display: 'none', width: '100%', height: '300px' }}
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
                <IconSettings />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        </Card>
      </Grid.Col>)}
    </Grid>
    
    <Grid display={selectedLot ? 'block' : 'none'}>
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
          style={{ width: '100%', height: 'calc(100vh - 60px - 32px)' }}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 4 }}>
        {/* <Paper
          mb="md"
          p="md"
          withBorder
        >
          <Title order={2}>{zones[0].name} - Spot {zones[0].spots[0].number}</Title>
          <Group mt="md">
            <Button>Move</Button>
            <Button
              color="red"
              variant="outline"
            >Delete</Button>
          </Group>
        </Paper> */}
        
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
                  <Text>{zone.spots.length} Spot{zone.spots.length !== 1 ? 's' : ''}</Text>
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
      <Title
        my="md"
        order={5}
      >Spots</Title>
      <Stack>
        <Box>
          <Button>Create</Button>
        </Box>
        <Text display={selectedZone?.spots?.length ? 'none' : 'block'}>No spots yet, create one above!</Text>
        {selectedZone?.spots
          .sort((a: any, b: any) => a.number - b.number)
          .map((spot: any) => <Group
          justify="space-between"
          key={spot.number}
        >
          <Text>{spot.number}</Text>
          <Group>
            <Button onClick={() => showSpot(spot.location)}>View</Button>
            <Button
              color="red"
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
        variant="outline"
      >Delete</Button>
    </Modal>
  </>;
}
