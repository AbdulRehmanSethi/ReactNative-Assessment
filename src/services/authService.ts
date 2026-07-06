import { mockAuthService } from '~/services/mockAuthService';
import { firebaseAuthService } from '~/services/firebaseAuthService';
import { AuthService } from '~/services/authTypes';

export type { AuthService, VerifyOtpResult } from '~/services/authTypes';

const useMockAuth = process.env.EXPO_PUBLIC_USE_MOCK_AUTH === 'true';

// Swap this export by toggling EXPO_PUBLIC_USE_MOCK_AUTH — authSlice, its
// thunks, and every screen stay unchanged either way.
export const authService: AuthService = useMockAuth ? mockAuthService : firebaseAuthService;
