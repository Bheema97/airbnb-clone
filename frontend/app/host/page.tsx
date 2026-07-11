"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck2, CircleDollarSign, Home, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { HostBookingSummary, ListingCardData } from "@/types";

export default function HostDashboardPage() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [bookings, setBookings] = useState<HostBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isHost = currentUser?.role === "host" || currentUser?.role === "both";
  const load = useCallback(async () => {
    if (!currentUser || !isHost) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const [owned, reservations] = await Promise.all([
        fetchApi<ListingCardData[]>(`/hosts/${currentUser.id}/listings`, { demoUserId: currentUser.id }),
        fetchApi<HostBookingSummary[]>(`/hosts/${currentUser.id}/bookings`, { demoUserId: currentUser.id }),
      ]);
      setListings(owned); setBookings(reservations);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load hosting data"); }
    finally { setLoading(false); }
  }, [currentUser, isHost]);
  useEffect(() => { load(); }, [load]);

  const upcoming = useMemo(() => bookings.filter((booking) => booking.status === "confirmed" && new Date(`${booking.check_out}T00:00:00`) > new Date()), [bookings]);
  const revenue = bookings.filter((booking) => booking.status === "confirmed").reduce((sum, booking) => sum + booking.total_amount, 0);

  const updateStatus = async (listing: ListingCardData, status: "active" | "archived") => {
    if (!currentUser) return;
    const verb = status === "archived" ? "archive" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${verb} ${listing.title}?`)) return;
    try { await fetchApi(`/listings/${listing.id}`, { method: "PATCH", demoUserId: currentUser.id, body: JSON.stringify({ status }) }); toast.success(status === "archived" ? "Listing archived" : "Listing reactivated"); load(); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : `Unable to ${verb} listing`); }
  };
  const removeListing = async (listing: ListingCardData) => {
    if (!currentUser || !window.confirm(`Delete ${listing.title}? Listings with future reservations will be archived instead.`)) return;
    try { await fetchApi(`/listings/${listing.id}`, { method: "DELETE", demoUserId: currentUser.id }); toast.success("Listing removed or archived safely"); load(); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to remove listing"); }
  };

  if (userLoading || loading) return <div className="mx-auto max-w-7xl animate-pulse px-4 py-10"><div className="h-10 w-72 rounded bg-gray-100" /><div className="mt-8 grid gap-4 sm:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-28 rounded-2xl bg-gray-100" />)}</div></div>;
  if (!isHost) return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><Home className="mx-auto h-12 w-12 text-rose-500" /><h1 className="mt-5 text-3xl font-semibold">Hosting is available to demo hosts</h1><p className="mt-3 text-gray-600">Use the demo-user switcher in the header and choose Marco, Sophie, or James to manage listings.</p><Link href="/" className="mt-7 inline-block rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white">Return to marketplace</Link></div>;

  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Hosting with StayFinder</p><h1 className="mt-1 text-3xl font-semibold">Welcome back, {currentUser?.name}</h1><p className="mt-2 text-gray-500">Manage your stays and keep an eye on upcoming guests.</p></div><Link href="/host/listings/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 font-semibold text-white"><Plus className="h-5 w-5" /> Create a listing</Link></div>{error && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}<button onClick={load} className="ml-3 font-semibold underline">Try again</button></div>}<div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border p-5"><Home className="h-5 w-5 text-rose-500" /><p className="mt-4 text-3xl font-semibold">{listings.filter((listing) => listing.status === "active").length}</p><p className="text-sm text-gray-500">Active listings</p></div><div className="rounded-2xl border p-5"><CalendarCheck2 className="h-5 w-5 text-rose-500" /><p className="mt-4 text-3xl font-semibold">{upcoming.length}</p><p className="text-sm text-gray-500">Upcoming reservations</p></div><div className="rounded-2xl border p-5"><CircleDollarSign className="h-5 w-5 text-rose-500" /><p className="mt-4 text-3xl font-semibold">${revenue.toFixed(0)}</p><p className="text-sm text-gray-500">Confirmed booking value</p></div></div><section className="mt-12"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Your listings</h2><span className="text-sm text-gray-500">{listings.length} total</span></div>{listings.length ? <div className="mt-5 grid gap-5 md:grid-cols-2">{listings.map((listing) => <article key={listing.id} className="overflow-hidden rounded-2xl border bg-white sm:flex"><div className="relative h-48 bg-gray-100 sm:h-auto sm:w-44">{listing.cover_image && <Image src={listing.cover_image} alt={listing.title} fill unoptimized className="object-cover" />}</div><div className="flex flex-1 flex-col justify-between p-5"><div><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{listing.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${listing.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{listing.status}</span></div><p className="mt-1 text-sm text-gray-500">{listing.city}, {listing.country}</p><p className="mt-3 font-semibold">${listing.price_per_night} <span className="text-sm font-normal text-gray-500">night</span></p></div><div className="mt-5 flex flex-wrap gap-2"><Link href={`/host/listings/${listing.id}/edit`} className="rounded-lg border px-3 py-2 text-sm font-semibold">Edit</Link><Link href={`/listings/${listing.id}`} className="rounded-lg border px-3 py-2 text-sm font-semibold">Preview</Link><button onClick={() => updateStatus(listing, listing.status === "active" ? "archived" : "active")} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600">{listing.status === "active" ? "Archive" : "Reactivate"}</button><button onClick={() => removeListing(listing)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600">Delete</button></div></div></article>)}</div> : <div className="mt-5 rounded-3xl border p-10 text-center"><Home className="mx-auto h-10 w-10 text-gray-400" /><h3 className="mt-4 text-xl font-semibold">Create your first stay</h3><p className="mt-2 text-gray-500">A polished listing can be live in just a few minutes.</p></div>}</section><section className="mt-12"><div className="flex items-center gap-3"><Users className="h-6 w-6 text-rose-500" /><h2 className="text-2xl font-semibold">Reservations</h2></div>{bookings.length ? <div className="mt-5 overflow-x-auto rounded-2xl border"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-stone-50 text-gray-500"><tr><th className="p-4 font-medium">Guest</th><th className="p-4 font-medium">Listing</th><th className="p-4 font-medium">Dates</th><th className="p-4 font-medium">Guests</th><th className="p-4 font-medium">Value</th><th className="p-4 font-medium">Status</th></tr></thead><tbody className="divide-y">{bookings.map((booking) => <tr key={booking.id}><td className="p-4 font-medium">{booking.guest_name || `Guest ${booking.guest_id}`}</td><td className="p-4">{booking.listing_title}</td><td className="p-4 whitespace-nowrap">{booking.check_in} → {booking.check_out}</td><td className="p-4">{booking.guest_count}</td><td className="p-4">${booking.total_amount.toFixed(2)}</td><td className="p-4 capitalize">{booking.status}</td></tr>)}</tbody></table></div> : <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-gray-500">No reservations yet.</div>}</section></div>;
}
