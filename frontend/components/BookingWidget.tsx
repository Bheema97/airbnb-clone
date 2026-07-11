"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListingDetailData, QuoteData } from "@/types";

interface BookingWidgetProps {
  listing: ListingDetailData;
  dateRange: DateRange | undefined;
}

export default function BookingWidget({ listing, dateRange }: BookingWidgetProps) {
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setIsLoading(true);
      fetchApi<QuoteData>("/bookings/quote", {
        method: "POST",
        body: JSON.stringify({
          listing_id: listing.id,
          check_in: format(dateRange.from, "yyyy-MM-dd"),
          check_out: format(dateRange.to, "yyyy-MM-dd"),
          guest_count: guests,
        }),
      })
        .then((data) => {
          if (data.is_available) {
            setQuote(data);
          } else {
            setQuote(null);
            toast.error("These dates are unavailable");
          }
        })
        .catch(() => {
          setQuote(null);
          toast.error("Failed to fetch quote");
        })
        .finally(() => setIsLoading(false));
    } else {
      setQuote(null);
    }
  }, [dateRange, guests, listing.id]);

  const handleReserve = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select a date range");
      return;
    }
    if (!quote?.is_available) {
      toast.error("Wait for an available price quote before reserving");
      return;
    }
    
    const params = new URLSearchParams({
      check_in: format(dateRange.from, "yyyy-MM-dd"),
      check_out: format(dateRange.to, "yyyy-MM-dd"),
      guests: guests.toString(),
    });
    
    router.push(`/checkout/${listing.id}?${params.toString()}`);
  };

  return (
    <div id="booking-widget" className="bg-white border rounded-xl shadow-lg p-6 sticky top-28 scroll-mt-28">
      <div className="mb-4">
        <span className="text-xl font-bold">${listing.price_per_night}</span>
        <span className="text-gray-500 text-sm"> / night</span>
      </div>

      <div className="border rounded-xl mb-4 overflow-hidden">
        <div className="flex border-b divide-x">
          <div className="p-3 w-1/2">
            <div className="text-[10px] font-bold uppercase">Check-in</div>
            <div className="text-sm">{dateRange?.from ? format(dateRange.from, "MM/dd/yyyy") : "Add date"}</div>
          </div>
          <div className="p-3 w-1/2">
            <div className="text-[10px] font-bold uppercase">Checkout</div>
            <div className="text-sm">{dateRange?.to ? format(dateRange.to, "MM/dd/yyyy") : "Add date"}</div>
          </div>
        </div>
        <div className="p-3">
          <div className="text-[10px] font-bold uppercase">Guests</div>
          <select 
            className="w-full text-sm outline-none bg-transparent mt-1"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
          >
            {Array.from({ length: listing.max_guests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleReserve}
        disabled={isLoading || !quote || (!dateRange?.from || !dateRange?.to)}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Calculating..." : "Reserve"}
      </button>

      {quote && (
        <div className="mt-4 text-sm text-gray-700">
          <div className="text-center text-gray-500 mb-4">You won&apos;t be charged yet</div>
          <div className="flex justify-between mb-2">
            <span className="underline">${quote.nightly_rate} x {quote.number_of_nights} nights</span>
            <span>${quote.subtotal}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="underline">Cleaning fee</span>
            <span>${quote.cleaning_fee}</span>
          </div>
          <div className="flex justify-between mb-4 pb-4 border-b">
            <span className="underline">Service fee</span>
            <span>${quote.service_fee}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-gray-900">
            <span>Total</span>
            <span>${quote.total_amount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
