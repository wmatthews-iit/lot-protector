'use client';

import { useUser } from '@/lib/firebase/useUser';
import {
  Card,
  Grid,
  Text,
  Title,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Find() {
  const user = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
      else router.push('/signin');
    }
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
  
  const spots: any[] = [
    {
      zone: '1',
      number: '1',
    },
    {
      zone: '1',
      number: '5',
    },
    {
      zone: '2',
      number: '3',
    },
  ];
  
  return <>
    <Title
      mb="md"
      order={2}
    >Available Parking Spots</Title>
    <Grid>
      {spots.map((spot) => {
        const zone = zones[spot.zone];
        
        return <Grid.Col
          key={`${spot.zone}-${spot.number}`}
          span={{ base: 12, md: 3 }}
        >
          <Card>
            <Grid>
              <Grid.Col span={6}>
                <Text fw="bold">{zone.name}</Text>
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
