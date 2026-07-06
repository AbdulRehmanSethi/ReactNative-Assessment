import { AuthService } from '~/services/authTypes';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockAuthService: AuthService = {
  async sendOtp(_phone) {
    await delay(400);
  },
  async verifyOtp(phone, code) {
    await delay(400);
    if (code !== '123456') {
      throw new Error('Invalid OTP code');
    }
    return { needsRegistration: true, uid: `mock-${phone}`, phone };
  },
  async signOut() {
    await delay(0);
  },
};
