'use client';

import SignInForm from '@/components/SignInForm';
import { auth } from '@/lib/firebase/app';
import { DEVELOPMENT } from '@/lib/firebase/config';
import { Title } from '@mantine/core';
import { sendSignInLinkToEmail } from 'firebase/auth';

export default function SignIn() {
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
  </>;
}
