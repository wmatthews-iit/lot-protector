'use client';

import { db } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import userValidation from '@/lib/validation/user';
import {
  Button,
  Modal,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
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
      variant="outline"
    >
      Delete Account
    </Button>
    
    <Modal
      centered
      onClose={closeEmail}
      opened={emailOpened}
      title="Change Email"
      zIndex={1400}
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
  </>;
}
