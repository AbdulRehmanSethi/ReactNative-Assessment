export type AuthStackParamList = {
  Welcome: undefined;
  Otp: { phone: string };
  Register: { role: 'partner' | 'driver'; uid?: string; phone?: string };
  RoleLogin: { role: 'partner' | 'driver' };
};

export type PartnerTabParamList = {
  Home: undefined;
  Rides: undefined;
  Profile: undefined;
};

export type DriverTabParamList = {
  Home: undefined;
  Requests: undefined;
  Profile: undefined;
};

export type PartnerStackParamList = {
  Tabs: undefined;
  Offers: { rideId: string };
  ActiveRide: { rideId: string };
};

export type DriverStackParamList = {
  Tabs: undefined;
  RequestDetail: { rideId: string };
  ActiveRide: { rideId: string };
};
