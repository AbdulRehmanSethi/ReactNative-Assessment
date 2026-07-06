import type { User } from '~/redux/auth/authSlice';

export interface VerifyOtpResult {
  needsRegistration: boolean;
  user?: User;
  uid?: string;
  phone?: string;
}

export interface AuthService {
  sendOtp(phone: string): Promise<void>;
  verifyOtp(phone: string, code: string): Promise<VerifyOtpResult>;
  signOut(): Promise<void>;
}
