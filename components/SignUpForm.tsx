'use client';

import userValidation from '@/lib/validation/user';
import {
  Button,
  Group,
  SegmentedControl,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';

export default function SignUpForm({ onSubmit }: { onSubmit: any }) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      role: '0',
    },
    validate: {
      name: userValidation.name,
      email: userValidation.email,
    },
  });
  
  return <form onSubmit={form.onSubmit(onSubmit)}>
    <TextInput
      key={form.key('name')}
      {...form.getInputProps('name')}
      label="Name"
      mb="sm"
    />
    <TextInput
      key={form.key('email')}
      {...form.getInputProps('email')}
      label="Email"
      mb="md"
    />
    <Group mb="md">
      <Text>I am a</Text>
      <SegmentedControl
        key={form.key('role')}
        {...form.getInputProps('role')}
        color="blue"
        data={[
          { value: '0', label: 'regular user' },
          { value: '1', label: 'parking lot admin' },
        ]}
      />
    </Group>
    <Button type="submit">Sign Up</Button>
  </form>;
}
