'use client';

import { auth } from '@/lib/firebase/app';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';

interface LotUser extends User {
  role: number,
}

export function useUser() {
  const [user, setUser] = useState<LotUser | string>('');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser == null) {
        setUser('none');
        return;
      }
      
      const userToken = await authUser.getIdTokenResult();
      setUser({ ...authUser, role: userToken.claims.isManager ? 1 : 0 } as LotUser);
    });
    
    return () => unsubscribe();
  }, []);
  
  return user;
}
