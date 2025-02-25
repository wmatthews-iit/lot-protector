'use client';

import { db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import userValidation from '@/lib/validation/user';
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
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function People() {
  const user = useUser();
  const [people, setPeople] = useState<any[]>([]);
  const router = useRouter();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
      else router.push('/signin');
    } else if (user.role !== 1) router.push('/find');
    
    let ignore = false;
    
    (async () => {
      if (ignore || typeof(user) === 'string' || user.role !== 1) return;
      const newPeople: any[] = [];
      const peopleDocuments = await getDocs(query(collection(db, 'people'),
        where('manager_id', '==', user.uid)));
      
      peopleDocuments.forEach((personDocument) => {
        const { name, email, license_plate, expiration_date } = personDocument.data();
        
        newPeople.push({
          id: personDocument.id,
          name,
          email,
          licensePlate: license_plate,
          expirationDate: expiration_date.toDate(),
        });
      });
      
      setPeople(newPeople);
    })();
    
    return () => { ignore = true };
  }, [user]);
  
  const [selectedID, selectPerson] = useState<string>();
  const selectedPerson = selectedID ? people.find((person) => person.id === selectedID) : null;
  const [addOpened, { toggle: toggleAdd, close: closeAdd }] = useDisclosure(false);
  const [manageOpened, { toggle: toggleManage, close: closeManage }] = useDisclosure(false);
  
  const currentTime = new Date();
  currentTime.setHours(0);
  currentTime.setMinutes(0);
  currentTime.setMilliseconds(0);
  const personExpired = selectedPerson ? (currentTime >= selectedPerson.expirationDate.getTime()) : false;
  
  const formatDate = (date: Date) => {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  const addForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      licensePlate: '',
      expirationDate: null,
    } as { email: string, licensePlate: string, expirationDate: Date | null },
    validate: {
      email: userValidation.email,
      licensePlate: userValidation.licensePlate,
    },
  });
  
  const updateForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      licensePlate: '',
      expirationDate: null,
    } as { licensePlate: string, expirationDate: Date | null },
    validate: {
      licensePlate: userValidation.optionalLicensePlate,
    },
  });
  
  const openManage = (person: any) => {
    selectPerson(person.id);
    updateForm.reset();
    toggleManage();
  };
  
  const addPerson = async ({ email, licensePlate, expirationDate }:
    { email: string, licensePlate: string, expirationDate: Date | null }) => {
    try {
      if (typeof(user) === 'string') return;
      const personDocuments = await getDocs(query(collection(db, 'people'), where('email', '==', email)));
      
      if (personDocuments.empty) {
        alert(`No account found with email: ${email}`);
        return;
      }
      
      const personDocument = personDocuments.docs[0];
      const personID = personDocument.id;
      
      if (personDocument.get('manager_id').length > 0) {
        alert('Account already has a manager');
        return;
      }
      
      await updateDoc(doc(db, 'people', personID),
        { manager_id: user.uid, license_plate: licensePlate, expiration_date: expirationDate });
      
      setPeople([...people, {
        id: personID,
        name: personDocument.get('name'),
        email,
        licensePlate,
        expirationDate,
      }]);
      
      addForm.reset();
      closeAdd();
    } catch (error) {
      console.log(error);
    }
  };
  
  const updatePerson = async ({ licensePlate, expirationDate }:
    { licensePlate: string, expirationDate: Date | null }) => {
    try {
      let updateInformation: any = {};
      if (licensePlate) updateInformation.license_plate = licensePlate;
      if (expirationDate) updateInformation.expiration_date = expirationDate;
      if (!licensePlate && !expirationDate) return;
      
      await updateDoc(doc(db, 'people', selectedID!), updateInformation);
      
      updateInformation = {};
      if (licensePlate) updateInformation.licensePlate = licensePlate;
      if (expirationDate) updateInformation.expirationDate = expirationDate;
      setPeople([...people.filter((person) => person.id !== selectedID!),
        { ...selectedPerson, ...updateInformation }]);
      
      updateForm.reset();
      closeManage();
    } catch (error) {
      console.log(error);
    }
  };
  
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
      <form onSubmit={addForm.onSubmit(addPerson)}>
        <TextInput
          key={addForm.key('email')}
          {...addForm.getInputProps('email')}
          data-autofocus
          label="Email"
          mb="sm"
        />
        <TextInput
          key={addForm.key('licensePlate')}
          {...addForm.getInputProps('licensePlate')}
          label="License Plate"
          mb="sm"
        />
        <DatePickerInput
          key={addForm.key('expirationDate')}
          {...addForm.getInputProps('expirationDate')}
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
      <form onSubmit={updateForm.onSubmit(updatePerson)}>
        <DatePickerInput
          key={updateForm.key('expirationDate')}
          {...updateForm.getInputProps('expirationDate')}
          clearable
          data-autofocus
          description="Leave empty if not changing"
          label="Expiration Date"
          mb="sm"
        />
        <TextInput
          key={updateForm.key('licensePlate')}
          {...updateForm.getInputProps('licensePlate')}
          description="Leave empty if not changing"
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
      >Remove</Button>
    </Modal>
  </>;
}
