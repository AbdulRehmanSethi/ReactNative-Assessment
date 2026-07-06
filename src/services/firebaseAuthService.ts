import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { AuthService, VerifyOtpResult } from '~/services/authTypes';
import { User } from '~/redux/auth/authSlice';

// Held module-scoped (not in Redux) because ConfirmationResult isn't serializable.
let confirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

function mapFirebaseError(err: unknown): Error {
  const code = (err as { code?: string })?.code?.replace('auth/', '') ?? '';

  switch (code) {
    case 'invalid-verification-code':
      return new Error('The code you entered is incorrect. Please try again.');
    case 'session-expired':
      return new Error('This code has expired. Request a new one.');
    case 'too-many-requests':
      return new Error('Too many attempts. Please wait a moment and try again.');
    case 'network-request-failed':
      return new Error('Network error. Check your connection and try again.');
    default:
      return new Error('Something went wrong. Please try again.');
  }
}

export const firebaseAuthService: AuthService = {
  async sendOtp(phone) {
    try {
      confirmation = await auth().signInWithPhoneNumber(phone);
    } catch (err) {
      throw mapFirebaseError(err);
    }
  },

  async verifyOtp(phone, code): Promise<VerifyOtpResult> {
    if (!confirmation) {
      throw new Error('No OTP request in progress. Please request a new code.');
    }

    try {
      const credential = await confirmation.confirm(code);
      const firebaseUser = credential?.user ?? auth().currentUser;
      if (!firebaseUser) {
        throw new Error('Verification failed. Please try again.');
      }

      const uid = firebaseUser.uid;
      const resolvedPhone = firebaseUser.phoneNumber ?? phone;

      const snapshot = await firestore().collection('users').doc(uid).get();
      if (snapshot.exists()) {
        const data = snapshot.data() as { role: 'partner' | 'driver'; fullName?: string };
        const user: User = {
          id: uid,
          phone: resolvedPhone,
          role: data.role,
          fullName: data.fullName ?? '',
        };
        confirmation = null;
        return { needsRegistration: false, user };
      }

      return { needsRegistration: true, uid, phone: resolvedPhone };
    } catch (err) {
      throw mapFirebaseError(err);
    }
  },

  async signOut() {
    confirmation = null;
    try {
      await auth().signOut();
    } catch {
      // Logging out is a local session-clearing action — a remote sign-out
      // failure (e.g. no real Firebase session was ever established, as with
      // the __DEV__ login shortcuts) should never block the user from logging out.
    }
  },
};
