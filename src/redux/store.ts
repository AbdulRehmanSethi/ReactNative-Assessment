import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  PersistConfig,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import authReducer from '~/redux/auth/authSlice';
import rideReducer, { RideState } from '~/redux/ride/rideSlice';
import driverReducer from '~/redux/driver/driverSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  ride: rideReducer,
  driver: driverReducer,
});

type CombinedState = ReturnType<typeof rootReducer>;

// Only `activeRideId` survives a restart — everything else in `ride` (drafts, negotiation
// state, quotes) is session-only and starts fresh on every launch, exactly as before. This is
// what lets a killed-and-reopened app resume straight to the Active Ride screen (Phase 5).
const rideTransform = createTransform<RideState, Partial<RideState>>(
  (inboundState) => ({ activeRideId: inboundState.activeRideId }),
  // redux-persist merges this partial object over the slice's own initialState at rehydration
  // time — it only ever needs to carry `activeRideId`, even though the type below expects the
  // full RideState shape.
  (outboundState) => outboundState as RideState,
  { whitelist: ['ride'] }
);

const persistConfig: PersistConfig<CombinedState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'ride'],
  transforms: [rideTransform],
  // The default reconciler (autoMergeLevel1) hard-replaces a whitelisted slice's entire state
  // with whatever was persisted — since `ride` only ever persists `{activeRideId}`, that wiped
  // out `draft`/`currentRequest`/`quotes`/etc. on every rehydration. Level2 shallow-merges one
  // level deeper, so the persisted `activeRideId` overlays the reducer's own defaults instead of
  // replacing them.
  stateReconciler: autoMergeLevel2,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
