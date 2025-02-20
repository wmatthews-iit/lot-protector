'use client';

import SignUpForm from '@/components/SignUpForm';
import { auth } from '@/lib/firebase/app';
import { DEVELOPMENT } from '@/lib/firebase/config';
import { Title } from '@mantine/core';
import { sendSignInLinkToEmail } from 'firebase/auth';

export default function SignUp() {
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
  </>;
}
