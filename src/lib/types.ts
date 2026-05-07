export type Bay = {
  id: string;
  label?: string;
  name?: string;
  status?: string;
  chargerType?: string;
  type?: string;
  maxKw?: number;
  power?: number;
  lastSeenAt?: string;
  updatedAt?: string;
};

export type StationImage = {
  id: string;
  url: string;
};

export type Station = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  pricingPerKwh?: number;
  status?: string;
  bays?: Bay[];
  images?: StationImage[];
};

export type Session = {
  id: string;
  stationId?: string;
  station?: { id: string; name: string };
  bayId?: string;
  bay?: Bay;
  driverId?: string;
  userId?: string;
  startedAt?: string;
  endedAt?: string;
  kwh?: number;
  energyKwh?: number;
  amount?: number;
  cost?: number;
  status?: string;
  paymentStatus?: string;
  paystackRef?: string;
};