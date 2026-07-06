import firestore from '@react-native-firebase/firestore';
import { checkImageSize } from '~/services/imageCompression';
import { mapFirestoreError } from '~/services/firestoreErrors';

export async function uploadImage(
  uid: string,
  key: string,
  base64: string,
  mime: string
): Promise<void> {
  checkImageSize(base64);
  try {
    await firestore()
      .collection('users')
      .doc(uid)
      .collection('media')
      .doc(key)
      .set({ data: base64, mime, createdAt: firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    throw mapFirestoreError(err);
  }
}
