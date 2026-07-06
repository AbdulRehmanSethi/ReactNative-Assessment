import firestore from '@react-native-firebase/firestore';
import { UserProfileDoc } from '~/services/profileTypes';
import { mapFirestoreError } from '~/services/firestoreErrors';

// Generates an id the same way Firestore would for an auto-id document, without writing
// anything — used when registering a user that never went through OTP (so has no uid yet).
export function generateProfileId(): string {
  return firestore().collection('users').doc().id;
}

export async function writeUserProfile(uid: string, doc: UserProfileDoc): Promise<void> {
  try {
    await firestore()
      .collection('users')
      .doc(uid)
      .set(
        {
          ...doc,
          // Denormalized for name-based login: Firestore has no case-insensitive query, so we
          // store a lowercased copy to match against instead of fetching every user client-side.
          fullNameLower: doc.fullName.trim().toLowerCase(),
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  try {
    const snapshot = await firestore().collection('users').doc(uid).get();
    return snapshot.exists() ? (snapshot.data() as UserProfileDoc) : null;
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

// Simple demo login: matches by role + case-insensitive full name. Deliberately has no
// orderBy so it never needs a composite Firestore index — with two equality filters only,
// Firestore serves this from its automatic single-field indexes. If several profiles share a
// name, the most recently created one wins (sorted client-side); a known limitation of a
// name-only login with no password.
export async function findUserByNameAndRole(
  role: 'partner' | 'driver',
  fullName: string
): Promise<UserProfileDoc | null> {
  try {
    const nameLower = fullName.trim().toLowerCase();
    const snapshot = await firestore()
      .collection('users')
      .where('role', '==', role)
      .where('fullNameLower', '==', nameLower)
      .get();

    if (snapshot.empty) return null;

    const docs = snapshot.docs
      .map((d) => d.data() as UserProfileDoc & { createdAt?: { toMillis(): number } })
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));

    return docs[0];
  } catch (err) {
    throw mapFirestoreError(err);
  }
}
