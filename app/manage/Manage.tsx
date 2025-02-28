'use client';

import AddressSearch from '@/components/AddressSearch';
import { db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import usePlacesAPI from '@/lib/usePlacesAPI';
import lotValidation from '@/lib/validation/lot';
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
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
import { IconSettings } from '@tabler/icons-react';
import { Map } from '@vis.gl/react-google-maps';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
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
      
      lotDocuments.forEach((lotDocument) => {
        const { name, address, location, time_to_alert, zones } = lotDocument.data();
        
        newLots.push({
          id: lotDocument.id,
          name,
          address,
          location,
          timeToAlert: time_to_alert,
          zones,
        });
      });
      
      setLots(newLots);
    })();
    
    return () => { ignore = true };
  }, [user]);
  
  const [lots, setLots] = useState<any[]>([]);
  
  const zones: any[] = [
    {
      id: '1',
      name: 'Zone A',
      address: '123 Example St',
      spots: [
        {
          number: '1',
        },
        {
          number: '2',
        },
        {
          number: '3',
        },
        {
          number: '4',
        },
        {
          number: '5',
        },
      ],
    },
    {
      id: '2',
      name: 'Zone B',
      address: '123 Example St',
      spots: [
        {
          number: '1',
        },
        {
          number: '2',
        },
        {
          number: '3',
        },
      ],
    },
  ];
  
  const [selectedLotID, selectLot] = useState<string>();
  const selectedLot = selectedLotID ? lots.find((lot) => lot.id === selectedLotID) : null;
  const [selectedAddress, setSelectedAddress] = useState<any>();
  const placesAPI = usePlacesAPI('search-map');
  const [selectedZoneID, selectZone] = useState<string>();
  const selectedZone = selectedZoneID ? zones.find((zone) => zone.id === selectedZoneID) : null;
  const [createLotOpened, { toggle: toggleCreateLot, close: closeCreateLot }] = useDisclosure(false);
  const [createZoneOpened, { toggle: toggleCreateZone, close: closeCreateZone }] = useDisclosure(false);
  const [manageZoneOpened, { toggle: toggleManageZone, close: closeManageZone }] = useDisclosure(false);
  
  const openManageZone = (zone: any) => {
    selectZone(zone.id);
    toggleManageZone();
  };
  
  const createLotForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      timeToAlert: '5',
    },
    validate: lotValidation,
  });
  
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
          zones: [],
        };
        
        const lotDocument = await addDoc(collection(db, 'parking_lots'), lot);
        
        lot.id = lotDocument.id;
        console.log(lot);
        setLots([...lots, lot]);
        closeCreateLot();
      } catch (error) {
        console.log(error);
      }
    });
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
    <Map
      defaultCenter={{ lat: 41.83701364962227, lng: -87.6259816795722 }}
      defaultZoom={17}
      disableDefaultUI={true}
      gestureHandling="greedy"
      id="search-map"
      style={{ display: 'none', width: '100%', height: '300px' }}
    />
    <Grid display={selectedLot ? 'none' : 'flex'}>
      {lots.map((lot) => <Grid.Col
        key={lot.id}
        span={{ base: 12, md: 4 }}
      >
        <Card>
          <Map
            clickableIcons={false}
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
    
    {/* <Grid>
      <Grid.Col
        h="calc(100vh - 60px - 16px)"
        span={{ base: 12, md: 8 }}
      >
        <LazyMap position={[41.83701364962227, -87.6259816795722]} />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper
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
        </Paper>
        
        <Paper
          mt="md"
          p="md"
          withBorder
        >
          <Title order={2}>Settings</Title>
          <NumberInput
            defaultValue={5}
            description="How many minutes should an alert be sent after a violation is detected?"
            label="Time to Alert"
            min={1}
            mt="md"
          />
          <Group mt="md">
            <Button>Update</Button>
            <Button variant="outline">Cancel</Button>
          </Group>
        </Paper>
        
        <Paper
          mt="md"
          p="md"
          withBorder
        >
          <Group
            justify="space-between"
            mb="md"
          >
            <Title order={2}>Zones</Title>
            <Button onClick={toggleCreate}>Create</Button>
          </Group>
          <Stack>
            {zones.map((zone) => <Card key={zone.id}>
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
                  <ActionIcon onClick={() => openManage(zone)}>
                    <IconSettings />
                  </ActionIcon>
                </Grid.Col>
              </Grid>
            </Card>)}
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid> */}
    
    <Modal
      centered
      onClose={closeCreateLot}
      opened={createLotOpened}
      title="Create Parking Lot"
      zIndex={1400}
    >
      <form onSubmit={createLotForm.onSubmit(createLot)}>
        <TextInput
          key={createLotForm.key('name')}
          {...createLotForm.getInputProps('name')}
          label="Name"
          mb="sm"
        />
        <AddressSearch
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
        <NumberInput
          key={createLotForm.key('timeToAlert')}
          {...createLotForm.getInputProps('timeToAlert')}
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
      <form onSubmit={(event) => event.preventDefault()}>
        <TextInput
          label="Name"
          mb="sm"
        />
        <TextInput
          label="Address"
          mb="md"
        />
        <Button type="submit">Create</Button>
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
      <form onSubmit={(event) => event.preventDefault()}>
        <TextInput
          label="Address"
          mb="md"
        />
        <Button type="submit">Update</Button>
      </form>
      <Title
        my="md"
        order={5}
      >Spots</Title>
      <Stack>
        {selectedZone?.spots.map((spot: any) => <Group
          justify="space-between"
          key={spot.number}
        >
          <Text>{spot.number}</Text>
          <Group>
            <Button>View</Button>
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
