import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import isPersonValid from './validation/user';

initializeApp();
const auth = getAuth();
const firestore = getFirestore();

exports.createPerson = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) return { success: false, message: 'Not signed in' };
  
  const person: any = {
    manager_id: '',
    name: request.data.name ?? null,
    email: request.auth?.token.email ?? '',
    license_plate: '',
    expiration_date: new Date(),
  };
  
  const personIsValid = isPersonValid(person);
  if (!personIsValid.success) return personIsValid;
  const people = firestore.collection('people');
  
  try {
    const personDocuments = await people.where('email', '==', person.email).get();
    if (!personDocuments.empty) return { success: false, message: 'Person already exists' };
    
    auth.setCustomUserClaims(uid, { isManager: request.data.role === '1' });
    await people.doc(uid).create(person);
    
    return { success: true };
  } catch (error) {
    logger.error(error);
    return { success: false, message: error };
  }
});
