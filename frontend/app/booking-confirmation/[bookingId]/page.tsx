"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, CalendarDays, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { BookingData } from "@/types";
import { useUser } from "@/lib/user-context";

export default function BookingConfirmationPage({ params }: { params: { bookingId: string } }) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState("");
  const { currentUser, isLoading: userLoading } = useUser();
  useEffect(() => {
    if (!currentUser) return;
    setError("");
    fetchApi<BookingData>(`/bookings/${params.bookingId}`, { demoUserId: currentUser.id }).then(setBooking).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load booking"));
  }, [currentUser, params.bookingId]);
  if (error) return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Confirmation unavailable</h1><p className="mt-2 text-gray-600">{error}</p></div>;
  if (userLoading || !booking) return <div className="py-24 text-center text-gray-500">Loading your confirmation…</div>;
  const listing = booking.listing;
  return <div className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-10"><CheckCircle2 className="h-14 w-14 text-emerald-500" /><p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Booking confirmed</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Your stay is all set</h1><p className="mt-2 text-gray-600">Confirmation #{booking.id}</p>{listing && <div className="mt-8 flex gap-4 border-y py-6"><div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">{listing.cover_image && <Image src={listing.cover_image} alt={listing.title} fill unoptimized className="object-cover" />}</div><div><h2 className="font-semibold">{listing.title}</h2><p className="mt-1 text-sm text-gray-500">{listing.city}, {listing.country}</p><p className="mt-3 text-sm font-semibold">${booking.total_amount.toFixed(2)} total</p></div></div>}<div className="grid gap-4 py-6 sm:grid-cols-2"><div className="flex gap-3"><CalendarDays className="h-5 w-5 text-gray-500" /><div><p className="text-sm font-semibold">Dates</p><p className="text-sm text-gray-600">{booking.check_in} → {booking.check_out}</p></div></div><div className="flex gap-3"><Users className="h-5 w-5 text-gray-500" /><div><p className="text-sm font-semibold">Guests</p><p className="text-sm text-gray-600">{booking.guest_count} guest{booking.guest_count === 1 ? "" : "s"}</p></div></div></div><div className="flex flex-col gap-3 sm:flex-row"><Link href="/trips" className="rounded-xl bg-rose-500 px-6 py-3 text-center font-semibold text-white">View My Trips</Link><Link href="/" className="rounded-xl border px-6 py-3 text-center font-semibold">Keep exploring</Link></div></div></div>;
}
