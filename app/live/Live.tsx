'use client';

import { useUser } from '@/lib/firebase/useUser';
import {
  ActionIcon,
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
import { Map } from '@vis.gl/react-google-maps';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Live() {
  const user = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
      else router.push('/signin');
    } else if (user.role !== 1) router.push('/find');
  }, [user]);
  
  const zones: any = {
    '1': {
      name: 'Zone A',
      address: '123 Example St',
    },
    '2': {
      name: 'Zone B',
      address: '123 Example St',
    },
  };
  
  const alerts: any[] = [
    {
      id: '1',
      zone: '1',
      spot: '1',
      time: new Date(),
      licensePlate: 'ABC1234',
    },
    {
      id: '2',
      zone: '2',
      spot: '3',
      time: new Date(Date.now() + 60 * 60 * 1000),
      licensePlate: 'DEF5678',
    },
    {
      id: '3',
      zone: '1',
      spot: '5',
      time: new Date(Date.now() + 2 * 60 * 60 * 1000),
      licensePlate: 'GHI9012',
    },
  ];
  
  const [selectedID, selectAlert] = useState<string>();
  const selectedAlert = selectedID ? alerts.find((alert) => alert.id === selectedID) : null;
  const selectedZone = selectedAlert ? zones[selectedAlert.zone] : null;
  const [viewOpened, { toggle: toggleView, close: closeView }] = useDisclosure(false);
  
  const viewAlert = (alert: any) => {
    selectAlert(alert.id);
    toggleView();
  };
  
  const formatTime = (time: Date) => {
    let hours = time.getHours();
    const isAM = hours < 12;
    if (hours === 0) hours += 12;
    else if (hours > 12) hours -= 12;
    
    return `${hours.toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')} ${isAM ? 'AM' : 'PM'}`;
  };
  
  return <>
    <Grid>
      <Grid.Col
        h="calc(100vh - 60px - 16px)"
        span={{ base: 12, md: 8 }}
      >
        <Map
          defaultCenter={{ lat: 41.83701364962227, lng: -87.6259816795722 }}
          defaultZoom={17}
          disableDefaultUI={true}
          gestureHandling="greedy"
          style={{ width: '100%', height: 'calc(100vh - 60px - 32px)' }}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper
          p="md"
          withBorder
        >
          <Title order={2}>Settings</Title>
          <Checkbox
            defaultChecked
            description="If unchecked, only sensors that are currently detecting violations will be shown. If checked, sensors with no cars or valid cars will be shown"
            label="Show Valid Sensors"
            mt="md"
          />
          <Checkbox
            defaultChecked
            description="A sensor is downed if it ran out of battery or if it's not working"
            label="Show Downed Sensors"
            mt="sm"
          />
        </Paper>
        
        <Paper
          mt="md"
          p="md"
          withBorder
        >
          <Title order={2}>Zone A - Spot 1</Title>
          <Text mt="md">Occupied, no violation</Text>
          <Text mt="md">Status: Working</Text>
          <Text>Battery: 50%</Text>
        </Paper>
        
        <Paper
          mt="md"
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
              const zone = zones[alert.zone];
              
              return <Card key={alert.id}>
                <Grid align="center">
                  <Grid.Col span="auto">
                    <Text fw="bold">{zone.name} - Spot {alert.spot}</Text>
                    <Text>{zone.address}</Text>
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
      <Title order={4}>{selectedZone?.name} - Spot {selectedAlert?.spot}</Title>
      <Text mb="md">{selectedZone?.address}</Text>
      <Text>Violation occurred at {selectedAlert ? formatTime(selectedAlert.time) : ''} by someone with the license plate: <strong>{selectedAlert?.licensePlate}</strong></Text>
      <Image
        mt="md"
        src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-10.png"
      />
    </Modal>
  </>;
}
