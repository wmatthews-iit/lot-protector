'use client';

import { auth } from '@/lib/firebase/app';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useUser() {
  const [user, setUser] = useState<User | null>();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => setUser(authUser));
    return () => unsubscribe();
  }, []);
  
  return user;
}