"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ApiError, fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";
import { BookingData, ListingDetailData, QuoteData } from "@/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage({ params }: { params: { listingId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useUser();
  
  const checkIn = searchParams.get("check_in");
  const checkOut = searchParams.get("check_out");
  const guests = parseInt(searchParams.get("guests") || "1");

  const [listing, setListing] = useState<ListingDetailData | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [conflictError, setConflictError] = useState(false);
  const [payment, setPayment] = useState({ card: "4242 4242 4242 4242", expiry: "12/30", cvv: "123" });

  useEffect(() => {
    if (!checkIn || !checkOut) {
      router.push(`/listings/${params.listingId}`);
      return;
    }

    Promise.all([
      fetchApi<ListingDetailData>(`/listings/${params.listingId}`),
      fetchApi<QuoteData>("/bookings/quote", {
        method: "POST",
        body: JSON.stringify({
          listing_id: parseInt(params.listingId),
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guests,
        })
      })
    ]).then(([listingData, quoteData]) => {
      setListing(listingData);
      if (quoteData.is_available) {
        setQuote(quoteData);
      } else {
        setConflictError(true);
      }
    }).catch(() => {
      toast.error("Failed to load checkout details");
    }).finally(() => setIsLoading(false));
  }, [params.listingId, checkIn, checkOut, guests, router]);

  const handleConfirm = async () => {
    if (!currentUser) {
      toast.error("Please select a demo user");
      return;
    }
    if (!payment.card.trim() || !payment.expiry.trim() || !payment.cvv.trim() || !agreed) {
      toast.error("Complete the mock payment details and accept the terms");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetchApi<BookingData>("/bookings", {
        method: "POST",
        demoUserId: currentUser.id,
        body: JSON.stringify({
          listing_id: parseInt(params.listingId),
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guests,
        })
      });
      
      toast.success("Booking confirmed!");
      router.push(`/booking-confirmation/${res.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setConflictError(true);
        toast.error("These dates are no longer available.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to confirm booking");
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center">Loading checkout...</div>;
  }

  if (conflictError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dates Unavailable</h1>
        <p className="text-gray-600 mb-8">We&apos;re sorry, but these dates have just been booked or blocked.</p>
        <Link 
          href={`/listings/${params.listingId}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold"
        >
          Return to listing to select new dates
        </Link>
      </div>
    );
  }

  if (!listing || !quote) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Request to book</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        <div className="flex-1 order-2 md:order-1">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your trip</h2>
            <div className="flex justify-between mb-4">
              <div>
                <div className="font-medium">Dates</div>
                <div className="text-gray-500">{checkIn} to {checkOut}</div>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <div className="font-medium">Guests</div>
                <div className="text-gray-500">{guests} guest{guests > 1 ? 's' : ''}</div>
              </div>
            </div>
          </section>

          <hr className="my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pay with (Mocked)</h2>
            <div className="overflow-hidden rounded-xl border">
              <input aria-label="Card number" value={payment.card} onChange={(event) => setPayment({ ...payment, card: event.target.value })} className="w-full border-b px-4 py-3" placeholder="Card number" />
              <div className="grid grid-cols-2 divide-x">
                <input aria-label="Expiry" value={payment.expiry} onChange={(event) => setPayment({ ...payment, expiry: event.target.value })} className="px-4 py-3" placeholder="MM/YY" />
                <input aria-label="CVV" value={payment.cvv} onChange={(event) => setPayment({ ...payment, cvv: event.target.value })} className="px-4 py-3" placeholder="CVV" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Demo only. No payment information is stored or processed.</p>
          </section>
          
          <hr className="my-8" />
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Required for your trip</h2>
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-1 w-5 h-5 accent-rose-500 cursor-pointer"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="terms" className="text-gray-700 cursor-pointer">
                I agree to the House Rules, Ground Rules for Guests, and the Refund Policy.
              </label>
            </div>
          </section>

          <hr className="my-8" />

          <button
            onClick={handleConfirm}
            disabled={!agreed || isSubmitting}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
          >
            {isSubmitting ? "Confirming..." : "Confirm and pay"}
          </button>
        </div>

        <div className="w-full md:w-[400px] order-1 md:order-2 shrink-0">
          <div className="border p-6 rounded-xl shadow-lg sticky top-28 bg-white">
            <div className="flex gap-4 mb-6 pb-6 border-b">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                {listing.images[0] && (
                  <Image src={listing.images[0].image_url} alt="Listing" fill unoptimized className="object-cover" />
                )}
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <div className="text-xs text-gray-500 uppercase">{listing.room_type} in {listing.city}</div>
                  <div className="font-medium text-sm leading-tight mt-1">{listing.title}</div>
                </div>
                <div className="text-xs">
                  <span className="font-bold">★ {listing.rating_average.toFixed(2)}</span> ({listing.review_count} reviews)
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Price details</h2>
            <div className="space-y-3 text-gray-700 pb-6 border-b">
              <div className="flex justify-between">
                <span>${quote.nightly_rate} x {quote.number_of_nights} nights</span>
                <span>${quote.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Cleaning fee</span>
                <span>${quote.cleaning_fee}</span>
              </div>
              <div className="flex justify-between">
                <span>StayFinder service fee</span>
                <span>${quote.service_fee}</span>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg pt-6">
              <span>Total (USD)</span>
              <span>${quote.total_amount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
