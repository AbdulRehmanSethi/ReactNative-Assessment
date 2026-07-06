import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LatLng, Ride, RideQuote, RideStatus, canTransition } from '~/features/ride/types';
import * as rideService from '~/services/rideService';

export interface DraftPoint {
  coords: LatLng;
  address: string;
}

export interface RideDraft {
  pickup: DraftPoint | null;
  dropoff: DraftPoint | null;
}

export interface RideState {
  activeRide: Ride | null;
  incoming: Ride | null;
  history: Ride[];
  lastError: string | null;
  draft: RideDraft;
  activeRideId: string | null;
  currentRequest: Ride | null;
  quotes: RideQuote[];
  incomingRequests: Ride[];
  incomingRequestsError: string | null;
  myQuote: RideQuote | null;
}

const initialState: RideState = {
  activeRide: null,
  incoming: null,
  history: [],
  lastError: null,
  draft: { pickup: null, dropoff: null },
  activeRideId: null,
  currentRequest: null,
  quotes: [],
  incomingRequests: [],
  incomingRequestsError: null,
  myQuote: null,
};

export const createRideRequest = createAsyncThunk<
  string,
  { partnerId: string; partnerName: string; pickup: DraftPoint; dropoff: DraftPoint }
>('ride/createRideRequest', async (params) => rideService.createRideRequest(params));

export const submitQuote = createAsyncThunk<void, rideService.SubmitQuoteParams>(
  'ride/submitQuote',
  async (params) => {
    await rideService.submitQuote(params);
  }
);

export const withdrawQuote = createAsyncThunk<void, { rideId: string; driverId: string }>(
  'ride/withdrawQuote',
  async ({ rideId, driverId }) => {
    await rideService.withdrawQuote(rideId, driverId);
  }
);

export const acceptQuote = createAsyncThunk<Ride, { rideId: string; driverId: string }>(
  'ride/acceptQuote',
  async ({ rideId, driverId }) => rideService.acceptQuote(rideId, driverId)
);

export const cancelRequest = createAsyncThunk<
  void,
  { rideId: string; cancelledBy: 'partner' | 'driver'; reason?: string }
>('ride/cancelRequest', async ({ rideId, cancelledBy, reason }) => {
  await rideService.cancelRide(rideId, cancelledBy, reason);
});

export const advanceToEnRoute = createAsyncThunk<void, { rideId: string }>(
  'ride/advanceToEnRoute',
  async ({ rideId }) => {
    await rideService.startEnRoute(rideId);
  }
);

export const advanceToArrived = createAsyncThunk<void, { rideId: string }>(
  'ride/advanceToArrived',
  async ({ rideId }) => {
    await rideService.markArrived(rideId);
  }
);

export const advanceToStarted = createAsyncThunk<void, { rideId: string }>(
  'ride/advanceToStarted',
  async ({ rideId }) => {
    await rideService.startRide(rideId);
  }
);

export const advanceToCompleted = createAsyncThunk<void, { rideId: string }>(
  'ride/advanceToCompleted',
  async ({ rideId }) => {
    await rideService.completeRide(rideId);
  }
);

const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    setIncomingRide(state, action: PayloadAction<Ride | null>) {
      state.incoming = action.payload;
    },
    setActiveRide(state, action: PayloadAction<Ride | null>) {
      state.activeRide = action.payload;
    },
    setActiveRideId(state, action: PayloadAction<string | null>) {
      state.activeRideId = action.payload;
    },
    setCurrentRequest(state, action: PayloadAction<Ride | null>) {
      state.currentRequest = action.payload;
    },
    setQuotes(state, action: PayloadAction<RideQuote[]>) {
      state.quotes = action.payload;
    },
    setIncomingRequests(state, action: PayloadAction<Ride[]>) {
      state.incomingRequests = action.payload;
    },
    setIncomingRequestsError(state, action: PayloadAction<string | null>) {
      state.incomingRequestsError = action.payload;
    },
    setMyQuote(state, action: PayloadAction<RideQuote | null>) {
      state.myQuote = action.payload;
    },
    clearRideNegotiation(state) {
      state.currentRequest = null;
      state.quotes = [];
      state.myQuote = null;
    },
    clearActiveRide(state) {
      state.activeRide = null;
      state.activeRideId = null;
    },
    updateStatus(state, action: PayloadAction<{ id: string; status: RideStatus }>) {
      const { id, status } = action.payload;
      const ride =
        state.activeRide?.id === id
          ? state.activeRide
          : state.incoming?.id === id
            ? state.incoming
            : null;

      if (!ride) {
        state.lastError = `Ride ${id} not found`;
        return;
      }
      if (!canTransition(ride.status, status)) {
        state.lastError = `Illegal transition: ${ride.status} -> ${status}`;
        return;
      }

      ride.status = status;
      ride.updatedAt = Date.now();
      state.lastError = null;

      if (status === RideStatus.RideCompleted || status === RideStatus.RideCancelled) {
        state.history.push(ride);
        if (state.activeRide?.id === id) state.activeRide = null;
        if (state.incoming?.id === id) state.incoming = null;
      }
    },
    setPickup(state, action: PayloadAction<DraftPoint>) {
      state.draft.pickup = action.payload;
    },
    setDropoff(state, action: PayloadAction<DraftPoint>) {
      state.draft.dropoff = action.payload;
    },
    clearDraft(state) {
      state.draft = { pickup: null, dropoff: null };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRideRequest.rejected, (state, action) => {
        state.lastError = action.error.message ?? 'Could not request a ride. Please try again.';
      })
      .addCase(submitQuote.rejected, (state, action) => {
        state.lastError = action.error.message ?? 'Could not submit your quote. Please try again.';
      })
      .addCase(withdrawQuote.rejected, (state, action) => {
        state.lastError = action.error.message ?? 'Could not withdraw your quote.';
      })
      .addCase(acceptQuote.fulfilled, (state, action) => {
        state.activeRide = action.payload;
        state.activeRideId = action.payload.id;
        state.currentRequest = null;
        state.quotes = [];
        state.myQuote = null;
        state.lastError = null;
      })
      .addCase(acceptQuote.rejected, (state, action) => {
        state.lastError = action.error.message ?? 'Could not accept this quote. Please try again.';
      })
      .addCase(cancelRequest.rejected, (state, action) => {
        state.lastError = action.error.message ?? 'Could not cancel this request.';
      })
      .addCase(advanceToEnRoute.rejected, (state, action) => {
        state.lastError = action.error.message ?? "Could not advance the ride's status.";
      })
      .addCase(advanceToArrived.rejected, (state, action) => {
        state.lastError = action.error.message ?? "Could not advance the ride's status.";
      })
      .addCase(advanceToStarted.rejected, (state, action) => {
        state.lastError = action.error.message ?? "Could not advance the ride's status.";
      })
      .addCase(advanceToCompleted.rejected, (state, action) => {
        state.lastError = action.error.message ?? "Could not advance the ride's status.";
      });
  },
});

export const {
  setIncomingRide,
  setActiveRide,
  setActiveRideId,
  setCurrentRequest,
  setQuotes,
  setIncomingRequests,
  setIncomingRequestsError,
  setMyQuote,
  clearRideNegotiation,
  clearActiveRide,
  updateStatus,
  setPickup,
  setDropoff,
  clearDraft,
} = rideSlice.actions;
export default rideSlice.reducer;
