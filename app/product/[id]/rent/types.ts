export type DateRange = {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
};

export type BookingLocation = {
  id: string;
  description: string;
  fullAddress: string;
};

export type BookingPageData = {
  item: {
    id: string;
    name: string;
    rentalFeePerDay: number;
    deposit: number;
    status: string;
    imageUrl: string | null;
  };
  owner: {
    displayName: string;
    avatarUrl?: string | null;
    isVerified: boolean;
    joinedAt: string;
  };
  locations: BookingLocation[];
  availability: DateRange[];
  bookedRanges: DateRange[];
  rating: {
    average: number;
    count: number;
  } | null;
};

export type BookingDraft = {
  item_id: string;
  user_id: string | null;
  start_date: string;
  end_date: string;
  meetup_location: string;
  return_location: string;
  rental_fee: number;
  deposit: number;
  total_paid: number;
  fee: number;
  net_income: number;
  status: string;
};
