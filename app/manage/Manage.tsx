'use client';

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
import { useDisclosure } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const LazyMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <Text>Loading...</Text>,
});

export default function Manage() {
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
  
  const [selectedID, selectZone] = useState<string>();
  const selectedZone = selectedID ? zones.find((zone) => zone.id === selectedID) : null;
  const [createOpened, { toggle: toggleCreate, close: closeCreate }] = useDisclosure(false);
  const [manageOpened, { toggle: toggleManage, close: closeManage }] = useDisclosure(false);
  
  const openManage = (zone: any) => {
    selectZone(zone.id);
    toggleManage();
  };
  
  // Add settings for how long until a violation is recorded
  
  return <>
    <Grid>
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
    </Grid>
    
    <Modal
      centered
      onClose={closeCreate}
      opened={createOpened}
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
      onClose={closeManage}
      opened={manageOpened}
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
