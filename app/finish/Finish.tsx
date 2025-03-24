'use client';

import SignInForm from '@/components/SignInForm';
import SignUpForm from '@/components/SignUpForm';
import { auth, functions } from '@/lib/firebase/app';
import { Box, Button, Modal, Text, TextInput, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getMultiFactorResolver, isSignInWithEmailLink, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, signInWithEmailLink, updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Finish() {
  const searchParams = useSearchParams();
  const isSignUp = searchParams.has('signup');
  const [detailsOpened, { toggle: toggleDetails, close: closeDetails }] = useDisclosure(false);
  const [finished, setFinished] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [textSent, setTextSent] = useState(false);
  const [verificationID, setVerificationID] = useState<any>(null);
  const [code, setCode] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [resolver, setResolver] = useState<any>(null);
  
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
        
        setFinished(true);
      }
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') await sendText(error);
      else console.log(error);
    }
  };
  
  useEffect(() => {
    let ignore = false;
    
    (async () => {
      if (!ignore) {
        setRecaptchaVerifier(new RecaptchaVerifier(auth, 'complete-button', {
          size: 'invisible',
          callback: (response: any) => {},
        }));
        
        if (isSignUp) tryToFinish({});
      }
    })();
    
    return () => { ignore = true };
  }, []);
  
  const sendText = async (error: any) => {
    if (!recaptchaVerifier || isSignUp && !auth.currentUser) return;
    
    try {
      if (isSignUp) {
        const multiFactorSession = await multiFactor(auth.currentUser!).getSession();
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        
        setVerificationID(await phoneAuthProvider.verifyPhoneNumber({
          phoneNumber,
          session: multiFactorSession,
        }, recaptchaVerifier));
      } else {
        const resolver = getMultiFactorResolver(auth, error);
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationID = await phoneAuthProvider
          .verifyPhoneNumber({ session: resolver.session, multiFactorHint: resolver.hints[0] }, recaptchaVerifier);
        setVerificationID(verificationID);
        setResolver(resolver);
      }
      
      setTextSent(true);
    } catch (error) {
      console.log(error);
      recaptchaVerifier.clear();
      setTextSent(false);
      setVerificationID(null);
    }
  };
  
  const confirmNumber = async (e: any) => {
    e?.preventDefault();
    if (!recaptchaVerifier || isSignUp && !auth.currentUser) return;
    
    try {
      if (isSignUp) {
        const phoneCredential = PhoneAuthProvider.credential(verificationID, code);
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneCredential);
        await multiFactor(auth.currentUser!).enroll(multiFactorAssertion, 'phone');
      } else {
        const phoneCredential = PhoneAuthProvider.credential(verificationID, code);
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneCredential);
        await resolver.resolveSignIn(multiFactorAssertion);
      }
      
      const token = await auth.currentUser!.getIdTokenResult(true);
      window.location.replace(token.claims.isManager ? (isSignUp ? '/manage' : '/live') : '/find');
    } catch (error) {
      console.log(error);
    }
  };
  
  return <>
    <Title
      mb="md"
      order={1}
    >Finishing Sign {isSignUp ? 'Up' : 'In'}</Title>
    <Text display={(!isSignUp || finished) ? 'none' : 'block'}>Finishing {isSignUp ? 'creating' : 'signing into'} your account...please wait</Text>
    <Box display={(!isSignUp || finished) && !textSent ? 'block' : 'none'}>
      <Text mb="md">Please complete two factor authentication through a text message. Standard rates will apply</Text>
      <form onSubmit={isSignUp ? ((e) => { e.preventDefault(); sendText(null) })
        : ((e) => { e.preventDefault(); tryToFinish({}) })}>
        <TextInput
          data-autofocus
          description="Format: +10123456789"
          display={isSignUp ? 'block' : 'none'}
          label="Phone Number"
          mb="sm"
          onChange={(event) => setPhoneNumber(event.currentTarget.value)}
          value={phoneNumber}
        />
        <Button
          disabled={isSignUp && phoneNumber.length === 0}
          id="complete-button"
          type="submit"
        >Send Text</Button>
      </form>
    </Box>
    
    <Box display={(!isSignUp || finished) && textSent ? 'block' : 'none'}>
      <form onSubmit={confirmNumber}>
        <TextInput
          data-autofocus
          label="Code"
          mb="sm"
          onChange={(event) => setCode(event.currentTarget.value)}
          value={code}
        />
        <Button
          disabled={isSignUp && phoneNumber.length === 0}
          type="submit"
        >Confirm Number</Button>
      </form>
    </Box>
    
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
