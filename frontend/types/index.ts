export interface ListingCardData {
  id: number;
  title: string;
  city: string;
  state: string;
  country: string;
  property_type: string;
  room_type: string;
  price_per_night: number;
  rating_average: number;
  review_count: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  status: string;
  cover_image: string | null;
}

export interface Amenity {
  id: number;
  name: string;
  category: string;
}

export interface ListingImage {
  id: number;
  image_url: string;
  display_order: number;
  alt_text: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export interface ListingDetailData extends ListingCardData {
  description: string;
  cleaning_fee: number;
  service_fee_percentage: number;
  host: User;
  images: ListingImage[];
  amenities: Amenity[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedListings {
  items: ListingCardData[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface DateRangeData {
  start: string;
  end: string;
}

export interface AvailabilityData {
  listing_id: number;
  booked_ranges: DateRangeData[];
  blocked_ranges: DateRangeData[];
}

export interface QuoteData {
  listing_id: number;
  check_in: string;
  check_out: string;
  guest_count: number;
  nightly_rate: number;
  number_of_nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total_amount: number;
  is_available: boolean;
  unavailability_reason?: string | null;
}

export interface BookingData {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guest_count: number;
  nightly_rate: number;
  number_of_nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total_amount: number;
  status: "confirmed" | "cancelled";
  created_at: string;
  listing: ListingCardData | null;
}

export interface FavoriteData {
  user_id: number;
  listing_id: number;
  created_at: string;
  listing: ListingCardData | null;
}

export interface ReviewData {
  id: number;
  listing_id: number;
  guest_id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: User | null;
}

export interface HostBookingSummary {
  id: number;
  listing_id: number;
  listing_title: string | null;
  guest_id: number;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  guest_count: number;
  total_amount: number;
  status: "confirmed" | "cancelled";
  created_at: string;
}
