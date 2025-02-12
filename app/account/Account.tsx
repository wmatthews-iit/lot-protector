'use client';

import {
  Button,
  Text,
  Title,
} from '@mantine/core';

export default function Account() {
  return <>
    <Title
      mb="md"
      order={2}
    >Account</Title>
    <Text fw="bold">Example Person</Text>
    <Text>person@gmail.com</Text>
    <Button
      mt="md"
    >
      Change Email
    </Button>
    <Title
      mt="md"
      order={3}
    >Danger Zone</Title>
    <Button
      color="red"
      mt="md"
      variant="outline"
    >
      Delete Account
    </Button>
  </>;
}
