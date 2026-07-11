"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { ListingDetailData } from "@/types";
import PhotoGallery from "./PhotoGallery";
import RatingDisplay from "./RatingDisplay";
import AvailabilityCalendar from "./AvailabilityCalendar";
import BookingWidget from "./BookingWidget";
import MapPlaceholder from "./MapPlaceholder";
import Image from "next/image";
import FavoriteButton from "./FavoriteButton";
import ReviewSection from "./ReviewSection";
import { parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";

export default function ListingDetailClient({ listing }: { listing: ListingDetailData }) {
  const searchParams = useSearchParams();
  const initialCheckIn = searchParams.get("check_in");
  const initialCheckOut = searchParams.get("check_out");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialCheckIn ? { from: parseISO(initialCheckIn), to: initialCheckOut ? parseISO(initialCheckOut) : undefined } : undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 relative">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <RatingDisplay rating={listing.rating_average} count={listing.review_count} />
          <span className="underline">
            {listing.city}, {listing.state}, {listing.country}
          </span>
        </div>
        <div className="absolute right-0 top-0 h-12 w-12"><FavoriteButton listingId={listing.id} onSurface /></div>
      </div>

      <PhotoGallery images={listing.images} />

      <div className="mt-8 flex flex-col md:flex-row gap-12 relative">
        <div className="flex-1">
          <div className="flex justify-between items-center border-b pb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">
                {listing.property_type} hosted by {listing.host.name}
              </h2>
              <div className="text-gray-500 text-sm flex gap-2">
                <span>{listing.max_guests} guests</span> &middot;
                <span>{listing.bedrooms} bedrooms</span> &middot;
                <span>{listing.beds} beds</span> &middot;
                <span>{listing.bathrooms} baths</span>
              </div>
            </div>
            {listing.host.avatar_url && (
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                <Image src={listing.host.avatar_url} alt={listing.host.name} fill className="object-cover" unoptimized />
              </div>
            )}
          </div>

          <div className="py-6 border-b">
            <h3 className="text-xl font-semibold mb-4">About this space</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
          </div>

          <div className="py-6 border-b"><h3 className="text-xl font-semibold mb-5">Guest reviews</h3><ReviewSection listingId={listing.id} /></div>

          <div className="py-6 border-b">
            <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
            <div className="grid grid-cols-2 gap-4">
              {listing.amenities.map(amenity => (
                <div key={amenity.id} className="flex items-center gap-3 text-gray-700">
                  <span>{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="py-6 border-b">
            <h3 className="text-xl font-semibold mb-4">Availability</h3>
            <AvailabilityCalendar 
              listingId={listing.id} 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange} 
            />
          </div>

          <div className="py-6">
            <h3 className="text-xl font-semibold mb-4">Where you&apos;ll be</h3>
            <MapPlaceholder city={listing.city} country={listing.country} />
          </div>
          <div className="md:hidden pb-8"><BookingWidget listing={listing} dateRange={dateRange} /></div>
        </div>

        {/* Desktop Sticky Widget */}
        <div className="hidden md:block w-[320px] lg:w-[380px] shrink-0">
          <BookingWidget listing={listing} dateRange={dateRange} />
        </div>
      </div>
      
      {/* Mobile Sticky Reserve Bar (simplified version of the widget) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-40">
        <div>
           <span className="text-lg font-bold">${listing.price_per_night}</span>
           <span className="text-sm text-gray-500"> / night</span>
        </div>
        <button 
           className="bg-rose-500 text-white px-6 py-2 rounded-lg font-bold"
           onClick={() => {
             // Let user scroll to calendar to select dates if none selected
             document.getElementById(dateRange?.from && dateRange?.to ? "booking-widget" : "availability-calendar")?.scrollIntoView({ behavior: "smooth", block: "center" });
           }}
        >
          {dateRange?.from && dateRange?.to ? 'Reserve' : 'Check availability'}
        </button>
      </div>
    </div>
  );
}
