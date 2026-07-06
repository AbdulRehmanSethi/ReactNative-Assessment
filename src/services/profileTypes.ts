export type VehicleType = 'bike' | 'car' | 'rickshaw';

interface UserProfileDocBase {
  uid: string;
  phone: string;
  fullName: string;
  cnic: string;
  profilePhotoKey: string;
  status: 'active';
}

export interface PartnerProfileDoc extends UserProfileDocBase {
  role: 'partner';
  email?: string;
}

export interface DriverProfileDoc extends UserProfileDocBase {
  role: 'driver';
  license: {
    number: string;
    expiryDate: string;
    imageKey: string;
  };
  vehicle: {
    type: VehicleType;
    model: string;
    registrationNumber: string;
    color: string;
    imageKeys: string[];
  };
}

export type UserProfileDoc = PartnerProfileDoc | DriverProfileDoc;
