import firestore from '@react-native-firebase/firestore';
import { LatLng } from '~/features/ride/types';
import { VehicleType } from '~/services/profileTypes';
import { mapFirestoreError } from '~/services/firestoreErrors';

export interface DriverLocationDoc {
  uid: string;
  role: 'driver';
  location: LatLng;
  online: boolean;
  vehicleType: VehicleType;
}

export interface OnlineDriver {
  uid: string;
  location: LatLng;
  vehicleType: VehicleType;
}

export async function publishDriverOnline(
  uid: string,
  vehicleType: VehicleType,
  location: LatLng
): Promise<void> {
  try {
    await firestore().collection('drivers').doc(uid).set(
      {
        uid,
        role: 'driver',
        vehicleType,
        location,
        online: true,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

export async function publishDriverLocation(uid: string, location: LatLng): Promise<void> {
  try {
    await firestore()
      .collection('drivers')
      .doc(uid)
      .set({ location, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

export async function publishDriverOffline(uid: string): Promise<void> {
  try {
    await firestore()
      .collection('drivers')
      .doc(uid)
      .set({ online: false, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

export function subscribeOnlineDrivers(
  onChange: (drivers: OnlineDriver[]) => void,
  onError: (err: Error) => void
): () => void {
  return firestore()
    .collection('drivers')
    .where('online', '==', true)
    .onSnapshot(
      (snapshot) => {
        const drivers = snapshot.docs.map((doc) => {
          const data = doc.data() as DriverLocationDoc;
          return { uid: data.uid, location: data.location, vehicleType: data.vehicleType };
        });
        onChange(drivers);
      },
      (err) => onError(mapFirestoreError(err))
    );
}
