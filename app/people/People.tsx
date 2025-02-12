'use client';

import {
  ActionIcon,
  Button,
  Modal,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { useState } from 'react';

export default function People() {
  const people: any[] = [
    {
      id: '1',
      name: 'Person 1',
      email: 'person1@gmail.com',
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      licensePlate: 'ABC1234',
    },
    {
      id: '2',
      name: 'Person 2',
      email: 'person2@gmail.com',
      expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      licensePlate: 'DEF5678',
    },
    {
      id: '3',
      name: 'Person 3',
      email: 'person3@gmail.com',
      expirationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      licensePlate: 'GHI9012',
    },
  ];
  
  const [selectedID, selectPerson] = useState<string>();
  const selectedPerson = selectedID ? people.find((person) => person.id === selectedID) : null;
  const [addOpened, { toggle: toggleAdd, close: closeAdd }] = useDisclosure(false);
  const [manageOpened, { toggle: toggleManage, close: closeManage }] = useDisclosure(false);
  
  const openManage = (person: any) => {
    selectPerson(person.id);
    toggleManage();
  };
  
  const currentTime = new Date();
  currentTime.setHours(0);
  currentTime.setMinutes(0);
  currentTime.setMilliseconds(0);
  const personExpired = selectedPerson ? (currentTime >= selectedPerson.expirationDate.getTime()) : false;
  
  const formatDate = (date: Date) => {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
  
  return <>
    <Title
      mb="md"
      order={2}
    >Manage People</Title>
    <Button onClick={toggleAdd}>Add Person</Button>
    <Table mt="md">
      <Table.Thead>
        <Table.Tr>
          <Table.Th visibleFrom="md">Name</Table.Th>
          <Table.Th visibleFrom="md">Email</Table.Th>
          <Table.Th hiddenFrom="md">Name and Email</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th w={48}></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {people.map((person) => {
          const expired = currentTime >= person.expirationDate.getTime();
          
          return <Table.Tr key={person.id}>
            <Table.Td visibleFrom="md">{person.name}</Table.Td>
            <Table.Td visibleFrom="md">{person.email}</Table.Td>
            <Table.Td hiddenFrom="md">
              <Text fw="bold">{person.name}</Text>
              <Text>{person.email}</Text>
            </Table.Td>
            <Table.Td c={expired ? 'red' : 'green'}>{expired ? 'Expired' : 'Active'}</Table.Td>
            <Table.Td w={48}>
              <ActionIcon onClick={() => openManage(person)}>
                <IconSettings />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>;
        })}
      </Table.Tbody>
    </Table>
    
    <Modal
      centered
      onClose={closeAdd}
      opened={addOpened}
      title="Add Person"
      zIndex={1400}
    >
      <form onSubmit={(event) => event.preventDefault()}>
        <TextInput
          label="Email"
          mb="sm"
        />
        <TextInput
          label="License Plate"
          mb="sm"
        />
        <DatePickerInput
          clearable
          label="Expiration Date"
          mb="md"
        />
        <Button type="submit">Add</Button>
      </form>
    </Modal>
    
    <Modal
      centered
      onClose={closeManage}
      opened={manageOpened}
      title="Manage Person"
      zIndex={1400}
    >
      <Title order={4}>{selectedPerson?.name}</Title>
      <Text mb="md">{selectedPerson?.email}</Text>
      <Text>Status: {personExpired ? 'Expired' : 'Active'}</Text>
      <Text mb="md">Expire{personExpired ? 'd' : 's'} on {selectedPerson ? formatDate(selectedPerson.expirationDate) : ''}</Text>
      <Text mb="md">License Plate: {selectedPerson?.licensePlate}</Text>
      <Title order={5}>Update Information</Title>
      <form onSubmit={(event) => event.preventDefault()}>
        <DatePickerInput
          clearable
          label="Expiration Date"
          mb="sm"
        />
        <TextInput
          label="License Plate"
          mb="md"
        />
        <Button type="submit">Update</Button>
      </form>
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
