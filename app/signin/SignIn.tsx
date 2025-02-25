'use client';

import SignInForm from '@/components/SignInForm';
import { auth } from '@/lib/firebase/app';
import { DEVELOPMENT } from '@/lib/firebase/config';
import { useUser } from '@/lib/firebase/useUser';
import { Anchor, Text, Title } from '@mantine/core';
import { sendSignInLinkToEmail } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignIn() {
  const user = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (typeof(user) === 'string') {
      if (user === '') return;
    } else router.push(user.role === 1 ? '/live' : '/find');
  }, [user]);
  
  const signIn = async ({ email }: { email: string }) => {
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${DEVELOPMENT ? 'http://localhost:3000' : 'https://lotp-app.web.app'}/finish?signin=true`,
        handleCodeInApp: true,
      });
      
      window.localStorage.setItem('email', email);
    } catch (error) {
      console.log(error);
    }
  }
  
  return <>
    <Title
      mb="md"
      order={1}
    >Sign In</Title>
    <SignInForm onSubmit={signIn} />
    <Text mt="md">
      Don't have an account yet?&nbsp;
      <Anchor
        component={Link}
        href="/signup"
      >Sign up</Anchor> instead
    </Text>
  </>;
}
