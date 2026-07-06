import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '~/services/authService';
import { uploadImage } from '~/services/mediaService';
import {
  writeUserProfile,
  generateProfileId,
  findUserByNameAndRole,
} from '~/services/profileService';
import { UserProfileDoc } from '~/services/profileTypes';
import { SimpleRegistrationPayload, countUploadSteps } from '~/redux/auth/registrationTypes';

export type AsyncStatus = 'idle' | 'loading' | 'otpSent' | 'succeeded' | 'failed';

// Kept stable across the whole app: rides key off `id` as partnerId/driverId, and `role` drives
// navigation between PartnerNavigator/DriverNavigator. `phone` is optional since a name-only
// simple-registered/logged-in account may never go through OTP.
export interface User {
  id: string;
  phone?: string;
  role: 'partner' | 'driver';
  fullName: string;
}

export interface RegistrationProgress {
  completed: number;
  total: number;
}

export interface AuthState {
  user: User | null;
  status: AsyncStatus;
  pendingPhone: string | null;
  pendingUid: string | null;
  error: string | null;
  registrationProgress: RegistrationProgress | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  pendingPhone: null,
  pendingUid: null,
  error: null,
  registrationProgress: null,
};

export const sendOtp = createAsyncThunk('auth/sendOtp', async (phone: string) => {
  await authService.sendOtp(phone);
  return phone;
});

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, code }: { phone: string; code: string }) => authService.verifyOtp(phone, code)
);

export const submitRegistration = createAsyncThunk<User, SimpleRegistrationPayload>(
  'auth/submitRegistration',
  async (payload, { dispatch }) => {
    let completed = 0;
    const bump = () => dispatch(setRegistrationProgress(++completed));

    const uid = payload.uid || generateProfileId();

    let profilePhotoKey = '';
    if (payload.profilePhoto) {
      await uploadImage(
        uid,
        'profilePhoto',
        payload.profilePhoto.base64,
        payload.profilePhoto.mime
      );
      profilePhotoKey = 'profilePhoto';
      bump();
    }

    let profileDoc: UserProfileDoc;

    if (payload.role === 'driver') {
      let licenseImageKey = '';
      if (payload.license?.image) {
        await uploadImage(uid, 'license', payload.license.image.base64, payload.license.image.mime);
        licenseImageKey = 'license';
        bump();
      }

      const imageKeys: string[] = [];
      const vehicleImages = payload.vehicle?.images ?? [];
      for (let i = 0; i < vehicleImages.length; i++) {
        const key = `vehicle_${i}`;
        await uploadImage(uid, key, vehicleImages[i].base64, vehicleImages[i].mime);
        imageKeys.push(key);
        bump();
      }

      profileDoc = {
        uid,
        phone: payload.phone ?? '',
        role: 'driver',
        fullName: payload.fullName,
        cnic: payload.cnic ?? '',
        profilePhotoKey,
        status: 'active',
        license: {
          number: payload.license?.number ?? '',
          expiryDate: payload.license?.expiryDate ?? '',
          imageKey: licenseImageKey,
        },
        vehicle: {
          // VehicleType has no empty/"unset" member — every driver-facing feature (going online,
          // quoting) assumes a concrete type, so default to 'car' when the field was left blank.
          type: payload.vehicle?.type ?? 'car',
          model: payload.vehicle?.model ?? '',
          registrationNumber: payload.vehicle?.registrationNumber ?? '',
          color: payload.vehicle?.color ?? '',
          imageKeys,
        },
      };
    } else {
      profileDoc = {
        uid,
        phone: payload.phone ?? '',
        role: 'partner',
        fullName: payload.fullName,
        cnic: payload.cnic ?? '',
        profilePhotoKey,
        status: 'active',
        // Firestore's .set() throws on a field explicitly valued `undefined` (unlike `null`),
        // so the key must be omitted entirely rather than set to undefined when no email is given.
        ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
      };
    }

    await writeUserProfile(uid, profileDoc);
    bump();

    return { id: uid, phone: payload.phone, role: payload.role, fullName: payload.fullName };
  }
);

export const loginByName = createAsyncThunk<
  User | null,
  { role: 'partner' | 'driver'; fullName: string }
>('auth/loginByName', async ({ role, fullName }) => {
  const profile = await findUserByNameAndRole(role, fullName);
  if (!profile) return null;
  return {
    id: profile.uid,
    phone: profile.phone || undefined,
    role: profile.role,
    fullName: profile.fullName,
  };
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.signOut();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRegistrationProgress(state, action: PayloadAction<number>) {
      if (state.registrationProgress) {
        state.registrationProgress.completed = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.status = 'otpSent';
        state.pendingPhone = action.payload;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to send OTP';
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.error = null;
        if (action.payload.user) {
          state.user = action.payload.user;
          state.status = 'succeeded';
          state.pendingPhone = null;
          state.pendingUid = null;
        } else {
          state.status = 'idle';
          state.pendingUid = action.payload.uid ?? null;
          state.pendingPhone = action.payload.phone ?? state.pendingPhone;
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Invalid code';
      })
      .addCase(submitRegistration.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.registrationProgress = {
          completed: 0,
          total: countUploadSteps(action.meta.arg),
        };
      })
      .addCase(submitRegistration.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.pendingPhone = null;
        state.pendingUid = null;
        state.registrationProgress = null;
      })
      .addCase(submitRegistration.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Could not complete registration. Please try again.';
        state.registrationProgress = null;
        // pendingUid/pendingPhone are deliberately left untouched so retry/resume stays possible.
      })
      .addCase(loginByName.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginByName.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.status = 'succeeded';
          state.error = null;
        } else {
          state.status = 'idle';
          state.error = 'No profile found — register first.';
        }
      })
      .addCase(loginByName.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Could not log in. Please try again.';
      })
      .addCase(logout.fulfilled, () => initialState)
      // Logging out clears the local session even if the remote sign-out call failed.
      .addCase(logout.rejected, () => initialState);
  },
});

export const { setRegistrationProgress } = authSlice.actions;
export default authSlice.reducer;
