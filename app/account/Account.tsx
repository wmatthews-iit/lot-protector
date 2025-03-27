'use client';

import { auth, db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import userValidation from '@/lib/validation/user';
import {
  Button,
  Group,
  Modal,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { deleteUser, updateEmail } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Account() {
  const user = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
      else router.push('/signin');
    }
  }, [user]);
  
  const [emailOpened, { toggle: toggleEmail, close: closeEmail }] = useDisclosure(false);
  const [deleteOpened, { toggle: toggleDelete, close: closeDelete }] = useDisclosure(false);
  
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '' },
    validate: { email: userValidation.email },
  });
  
  const changeEmail = async ({ email }: { email: string }) => {
    try {
      if (typeof(user) === 'string') return;
      await updateEmail(user, email);
      await updateDoc(doc(db, 'people', user.uid), { email });
      closeEmail();
    } catch (error) {
      console.log(error);
    }
  };
  
  const deleteAccount = async () => {
    if (typeof(user) === 'string') return;
    
    try {
      if (user.role == 1) {
        const lotDocuments = await getDocs(query(collection(db, 'parking_lots'), where('manager_id', '==', user.uid)));
        
        for (const lotDocument of lotDocuments.docs) {
          const spotDocuments = await getDocs(query(collection(db, 'parking_spots'), where('lot_id', '==', lotDocument.id)));
          
          for (const spotDocument of spotDocuments.docs) {
            await deleteDoc(spotDocument.ref);
          }
          
          const alertDocuments = await getDocs(query(collection(db, 'alerts'), where('lot_id', '==', lotDocument.id)));
          
          for (const alertDocument of alertDocuments.docs) {
            await deleteDoc(alertDocument.ref);
          }
          
          await deleteDoc(doc(db, 'parking_lots', lotDocument.id));
        }
        
        const peopleDocuments = await getDocs(query(collection(db, 'people'), where('manager_id', '==', user.uid)));
        
        for (const personDocument of peopleDocuments.docs) {
          updateDoc(personDocument.ref, { manager_id: '' });
        }
      }
      
      await deleteDoc(doc(db, 'people', user.uid));
      await deleteUser(auth.currentUser!);
      window.location.replace('/signup');
    } catch (error) {
      console.log(error);
    }
  };
  
  return <>
    <Title
      mb="md"
      order={2}
    >Account</Title>
    <Text fw="bold">{typeof(user) !== 'string' ? user.displayName : ''}</Text>
    <Text>{typeof(user) !== 'string' ? user.email : ''}</Text>
    <Button
      mt="md"
      onClick={toggleEmail}
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
      onClick={toggleDelete}
      variant="outline"
    >
      Delete Account
    </Button>
    
    <Modal
      centered
      onClose={closeEmail}
      opened={emailOpened}
      title="Change Email"
    >
      <form onSubmit={form.onSubmit(changeEmail)}>
        <Text mb="md">You may need to sign in again before changing your email</Text>
        <TextInput
          key={form.key('email')}
          {...form.getInputProps('email')}
          label="Email"
          mb="md"
        />
        <Button type="submit">Change</Button>
      </form>
    </Modal>
    
    <Modal
      centered
      onClose={closeDelete}
      opened={deleteOpened}
      title="Delete Account"
    >
      <Text mb="md">Are you sure you want to delete your account? This will delete all data related to your account, except for any parking violations.</Text>
      <Group justify="space-between">
        <Button
          onClick={closeDelete}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          color="red"
          onClick={deleteAccount}
        >
          Delete
        </Button>
      </Group>
    </Modal>
  </>;
}
