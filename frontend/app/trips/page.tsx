"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { BookingData } from "@/types";

type TripGroup = "Upcoming" | "Past" | "Cancelled";

function TripCard({ booking, onCancel }: { booking: BookingData; onCancel: (id: number) => void }) {
  const listing = booking.listing;
  const upcoming = booking.status === "confirmed" && new Date(`${booking.check_out}T00:00:00`) > new Date();
  return <article className="overflow-hidden rounded-2xl border bg-white shadow-sm sm:flex"><div className="relative h-48 bg-gray-100 sm:h-auto sm:w-56">{listing?.cover_image && <Image src={listing.cover_image} alt={listing.title} fill unoptimized className="object-cover" />}</div><div className="flex flex-1 flex-col justify-between p-5"><div><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{booking.status}</p><h3 className="mt-1 text-xl font-semibold">{listing?.title || `Listing ${booking.listing_id}`}</h3></div><span className="font-semibold">${booking.total_amount.toFixed(2)}</span></div><p className="mt-2 text-sm text-gray-500">{listing ? `${listing.city}, ${listing.country}` : ""}</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span>{booking.check_in} → {booking.check_out}</span><span>{booking.guest_count} guest{booking.guest_count === 1 ? "" : "s"}</span></div></div><div className="mt-5 flex gap-3"><Link href={`/listings/${booking.listing_id}`} className="rounded-lg border px-4 py-2 text-sm font-semibold">View listing</Link>{upcoming && <button onClick={() => onCancel(booking.id)} className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cancel trip</button>}</div></div></article>;
}

export default function TripsPage() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => { if (!currentUser) { setBookings([]); setLoading(false); return; } setLoading(true); setError(""); fetchApi<BookingData[]>(`/users/${currentUser.id}/bookings`, { demoUserId: currentUser.id }).then(setBookings).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load trips")).finally(() => setLoading(false)); }, [currentUser]);
  useEffect(load, [load]);
  const cancel = async (bookingId: number) => { if (!currentUser || !window.confirm("Cancel this reservation? The dates will become available again.")) return; try { await fetchApi<BookingData>(`/bookings/${bookingId}/cancel`, { method: "POST", demoUserId: currentUser.id }); toast.success("Trip cancelled and dates released"); load(); } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to cancel trip"); } };
  if (userLoading || loading) return <div className="py-24 text-center text-gray-500">Loading your trips…</div>;
  const now = new Date();
  const groups: Record<TripGroup, BookingData[]> = { Upcoming: bookings.filter((booking) => booking.status === "confirmed" && new Date(`${booking.check_out}T00:00:00`) > now), Past: bookings.filter((booking) => booking.status === "confirmed" && new Date(`${booking.check_out}T00:00:00`) <= now), Cancelled: bookings.filter((booking) => booking.status === "cancelled") };
  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Travel plans</p><h1 className="mt-1 text-3xl font-semibold">My Trips</h1>{error ? <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div> : !bookings.length ? <div className="mt-10 rounded-3xl border p-10 text-center"><CalendarX2 className="mx-auto h-10 w-10 text-gray-400" /><h2 className="mt-4 text-xl font-semibold">No trips booked</h2><p className="mt-2 text-gray-500">When you reserve a stay, every detail will appear here.</p><Link href="/" className="mt-6 inline-block rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white">Start exploring</Link></div> : <div className="mt-10 space-y-12">{(Object.keys(groups) as TripGroup[]).map((group) => groups[group].length ? <section key={group}><h2 className="mb-4 text-xl font-semibold">{group} <span className="text-sm font-normal text-gray-500">({groups[group].length})</span></h2><div className="space-y-5">{groups[group].map((booking) => <TripCard key={booking.id} booking={booking} onCancel={cancel} />)}</div></section> : null)}</div>}</div>;
}
