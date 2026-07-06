import { VehicleType } from '~/services/profileTypes';

export interface PickedImageInput {
  base64: string;
  mime: string;
}

// Only fullName is required — every other field is optional so a demo account can be created
// with minimal input while still supporting all the assessment fields when provided.
export interface SimpleRegistrationPayload {
  uid?: string;
  phone?: string;
  role: 'partner' | 'driver';
  fullName: string;
  cnic?: string;
  email?: string; // partner only
  profilePhoto?: PickedImageInput;
  license?: {
    number?: string;
    expiryDate?: string | null;
    image?: PickedImageInput;
  };
  vehicle?: {
    type?: VehicleType;
    model?: string;
    registrationNumber?: string;
    color?: string;
    images?: PickedImageInput[];
  };
}

export function countUploadSteps(payload: SimpleRegistrationPayload): number {
  const profilePhotoStep = payload.profilePhoto ? 1 : 0;
  const licenseStep = payload.role === 'driver' && payload.license?.image ? 1 : 0;
  const vehicleImageSteps = payload.role === 'driver' ? (payload.vehicle?.images?.length ?? 0) : 0;
  return profilePhotoStep + licenseStep + vehicleImageSteps + 1; // +1 for the final profile-doc write
}
