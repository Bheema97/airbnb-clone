"use client";

import { useEffect, useState } from "react";
import ListingGrid from "./ListingGrid";
import { FavoriteData, ListingCardData } from "@/types";
import { useUser } from "@/lib/user-context";
import { fetchApi } from "@/lib/api";

export default function ClientListingGrid({ listings }: { listings: ListingCardData[] }) {
  const { currentUser } = useUser();
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchApi<FavoriteData[]>(`/users/${currentUser.id}/favorites`, { demoUserId: currentUser.id })
        .then(data => {
          setFavorites(data.map((fav) => fav.listing_id));
        })
        .catch(() => setFavorites([]));
    } else {
      setFavorites([]);
    }
  }, [currentUser]);

  return <ListingGrid listings={listings} userFavorites={favorites} />;
}
