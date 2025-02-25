'use client';

import SignUpForm from '@/components/SignUpForm';
import { auth } from '@/lib/firebase/app';
import { DEVELOPMENT } from '@/lib/firebase/config';
import { useUser } from '@/lib/firebase/useUser';
import { Anchor, Text, Title } from '@mantine/core';
import { sendSignInLinkToEmail } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUp() {
  const user = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
    } else router.push(user.role === 1 ? '/live' : '/find');
  }, [user]);
  
  const signUp = async ({ name, email, role }:
    { name: string, email: string, role: string }) => {
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${DEVELOPMENT ? 'http://localhost:3000' : 'https://lotp-app.web.app'}/finish?signup=true`,
        handleCodeInApp: true,
      });
      
      window.localStorage.setItem('name', name);
      window.localStorage.setItem('email', email);
      window.localStorage.setItem('role', role);
    } catch (error) {
      console.log(error);
    }
  }
  
  return <>
    <Title
      mb="md"
      order={1}
    >Sign Up</Title>
    <SignUpForm onSubmit={signUp} />
    <Text mt="md">
      Already have an account?&nbsp;
      <Anchor
        component={Link}
        href="/signin"
      >Sign in</Anchor> instead
    </Text>
  </>;
}
