import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LatLng } from '~/features/ride/types';
import { VehicleType } from '~/services/profileTypes';
import {
  publishDriverOnline,
  publishDriverLocation,
  publishDriverOffline,
} from '~/services/driverLocationService';

export interface DriverState {
  online: boolean;
  location: LatLng | null;
  lastPublishError: string | null;
}

const initialState: DriverState = {
  online: false,
  location: null,
  lastPublishError: null,
};

export const goOnline = createAsyncThunk<
  void,
  { uid: string; vehicleType: VehicleType; location: LatLng }
>('driver/goOnline', async ({ uid, vehicleType, location }) => {
  await publishDriverOnline(uid, vehicleType, location);
});

export const goOffline = createAsyncThunk<void, { uid: string }>(
  'driver/goOffline',
  async ({ uid }) => {
    await publishDriverOffline(uid);
  }
);

export const publishLocation = createAsyncThunk<void, { uid: string; location: LatLng }>(
  'driver/publishLocation',
  async ({ uid, location }) => {
    await publishDriverLocation(uid, location);
  }
);

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    setOnline(state, action: PayloadAction<boolean>) {
      state.online = action.payload;
    },
    setLocation(state, action: PayloadAction<LatLng>) {
      state.location = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(goOnline.fulfilled, (state) => {
        state.lastPublishError = null;
      })
      .addCase(goOnline.rejected, (state, action) => {
        state.online = false;
        state.lastPublishError = action.error.message ?? 'Could not go online. Please try again.';
      })
      .addCase(goOffline.rejected, (state, action) => {
        state.lastPublishError = action.error.message ?? 'Could not go offline. Please try again.';
      })
      .addCase(publishLocation.rejected, (state, action) => {
        state.lastPublishError = action.error.message ?? 'Could not update your location.';
      });
  },
});

export const { setOnline, setLocation } = driverSlice.actions;
export default driverSlice.reducer;
