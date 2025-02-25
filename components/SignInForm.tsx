'use client';

import userValidation from '@/lib/validation/user';
import {
  Button,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';

export default function SignInForm({ onSubmit }: { onSubmit: any }) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '' },
    validate: { email: userValidation.email },
  });
  
  return <form onSubmit={form.onSubmit(onSubmit)}>
    <TextInput
      key={form.key('email')}
      {...form.getInputProps('email')}
      data-autofocus
      label="Email"
      mb="md"
    />
    <Button type="submit">Sign In</Button>
  </form>;
}
