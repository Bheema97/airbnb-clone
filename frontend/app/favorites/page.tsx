"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ListingGrid from "@/components/ListingGrid";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { FavoriteData } from "@/types";

export default function FavoritesPage() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [favorites, setFavorites] = useState<FavoriteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { if (!currentUser) { setFavorites([]); setLoading(false); return; } setLoading(true); setError(""); fetchApi<FavoriteData[]>(`/users/${currentUser.id}/favorites`, { demoUserId: currentUser.id }).then(setFavorites).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load favorites")).finally(() => setLoading(false)); }, [currentUser]);
  if (userLoading || loading) return <div className="py-24 text-center text-gray-500">Loading saved stays…</div>;
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Your collection</p><h1 className="mt-1 text-3xl font-semibold">Favorites</h1>{error ? <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div> : favorites.length ? <div className="mt-8"><ListingGrid listings={favorites.flatMap((favorite) => favorite.listing ? [favorite.listing] : [])} userFavorites={favorites.map((favorite) => favorite.listing_id)} onFavoriteChange={(listingId, isFavorite) => { if (!isFavorite) setFavorites((items) => items.filter((favorite) => favorite.listing_id !== listingId)); }} /></div> : <div className="mt-10 rounded-3xl border p-10 text-center"><Heart className="mx-auto h-10 w-10 text-rose-400" /><h2 className="mt-4 text-xl font-semibold">No saved stays yet</h2><p className="mt-2 text-gray-500">Tap the heart on any listing to build your shortlist.</p><Link href="/" className="mt-6 inline-block rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white">Explore stays</Link></div>}</div>;
}
