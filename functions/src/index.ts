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

exports.updateAvailability = onCall(async (request) => {
  const { spot_id, occupied } = request.data;
  
  if (typeof(spot_id) !== 'string') return { success: false, message: 'Parking spot ID must be a string' };
  if (typeof(occupied) !== 'boolean') return { success: false, message: 'Occupied must be a boolean' };
  
  try {
    const spotDocument = await firestore.collection('parking_spots').doc(spot_id).get();
    if (!spotDocument.exists) return { success: false, message: 'Parking spot does not exist' };
    const updatedSpot: any = { occupied, last_working: new Date() };
    
    if (spotDocument.get('violation') === true && !occupied) {
      updatedSpot.violation = false;
      const alertDocuments = await firestore.collection('alerts').where('spot_id', '==', spot_id).get();
      
      for (const alertDocument of alertDocuments.docs) {
        await alertDocument.ref.delete();
      }
    }
    
    await spotDocument.ref.update(updatedSpot);
    return { success: true };
  } catch (error) {
    logger.error(error);
    return { success: false, message: error };
  }
});

exports.updateBattery = onCall(async (request) => {
  const { spot_id, battery } = request.data;
  
  if (typeof(spot_id) !== 'string') return { success: false, message: 'Parking spot ID must be a string' };
  if (typeof(battery) !== 'number' || battery < 0 || battery > 1)
    return { success: false, message: 'Battery must be a number between 0 and 1' };
  
  try {
    const spotDocument = await firestore.collection('parking_spots').doc(spot_id).get();
    if (!spotDocument.exists) return { success: false, message: 'Parking spot does not exist' };
    await spotDocument.ref.update({ battery, last_working: new Date() });
    
    return { success: true };
  } catch (error) {
    logger.error(error);
    return { success: false, message: error };
  }
});

exports.alertViolation = onCall(async (request) => {
  const { spot_id, license_plate } = request.data;
  
  if (typeof(spot_id) !== 'string') return { success: false, message: 'Parking spot ID must be a string' };
  if (typeof(license_plate) !== 'string' || license_plate.length < 1 || license_plate.length > 8)
    return { success: false, message: 'License plate must be a string of length 1 to 8' };
  
  try {
    const spotDocument = await firestore.collection('parking_spots').doc(spot_id).get();
    if (!spotDocument.exists) return { success: false, message: 'Parking spot does not exist' };
    await spotDocument.ref.update({ violation: true, last_working: new Date() });
    
    await firestore.collection('alerts').add({
      lot_id: spotDocument.get('lot_id'),
      spot_id,
      time: new Date(),
      license_plate,
    });
    
    return { success: true };
  } catch (error) {
    logger.error(error);
    return { success: false, message: error };
  }
});
