'use client';

import SignInForm from '@/components/SignInForm';
import SignUpForm from '@/components/SignUpForm';
import { auth, functions } from '@/lib/firebase/app';
import { Modal, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { isSignInWithEmailLink, signInWithEmailLink, updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Finish() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = searchParams.has('signup');
  const [detailsOpened, { toggle: toggleDetails, close: closeDetails }] = useDisclosure(false);
  
  const tryToFinish = async ({ name, email, role }:
    { name?: string, email?: string, role?: string }) => {
    try {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const userName = name || window.localStorage.getItem('name');
        const userEmail = email || window.localStorage.getItem('email');
        const userRole = role || window.localStorage.getItem('role');
        
        if ((!userName && isSignUp) || !userEmail || (!userRole && isSignUp)) {
          toggleDetails();
          return;
        }
        
        const userCredential = await signInWithEmailLink(auth, userEmail, window.location.href);
        window.localStorage.removeItem('name');
        window.localStorage.removeItem('email');
        window.localStorage.removeItem('role');
        if (!auth.currentUser) return;
        
        if (isSignUp) {
          await updateProfile(userCredential.user, { displayName: userName });
          const result = await httpsCallable(functions, 'createPerson')({ name: userName!.length > 0 ? userName : undefined, role: userRole });
          const resultData: any = result.data;
          
          if (resultData.success) await userCredential.user.getIdTokenResult(true);
          else {
            console.log(resultData.message);
            return;
          }
        }
        
        const user = await userCredential.user.getIdTokenResult();
        router.push(user.claims.isManager ? '/live' : '/find');
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
    let ignore = false;
    
    (async () => {
      if (!ignore) tryToFinish({});
    })();
    
    return () => { ignore = true };
  }, []);
  
  return <>
    <Title
      mb="md"
      order={1}
    >Finishing Sign {isSignUp ? 'Up' : 'In'}</Title>
    <Text>Finishing {isSignUp ? 'creating' : 'signing into'} your account...please wait</Text>
    <Modal
      centered
      onClose={closeDetails}
      opened={detailsOpened}
      title={`Finish Sign ${isSignUp ? 'Up' : 'In'}`}
      zIndex={1400}
    >
      {isSignUp ? <SignUpForm onSubmit={tryToFinish} />
        : <SignInForm onSubmit={tryToFinish} />}
    </Modal>
  </>;
}
