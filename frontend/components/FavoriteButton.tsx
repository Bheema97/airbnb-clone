"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/user-context";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { FavoriteData } from "@/types";

interface FavoriteButtonProps {
  listingId: number;
  initialIsFavorite?: boolean;
  onChange?: (isFavorite: boolean) => void;
  onSurface?: boolean;
}

export default function FavoriteButton({ listingId, initialIsFavorite = false, onChange, onSurface = false }: FavoriteButtonProps) {
  const { currentUser, isLoading: userLoading } = useUser();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
    if (currentUser) {
      fetchApi<FavoriteData[]>(`/users/${currentUser.id}/favorites`, { demoUserId: currentUser.id })
        .then((favorites) => setIsFavorite(favorites.some((favorite) => favorite.listing_id === listingId)))
        .catch(() => setIsFavorite(false));
    }
  }, [currentUser, initialIsFavorite, listingId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error("Please select a demo user to favorite listings");
      return;
    }

    setIsLoading(true);
    const prev = isFavorite;
    setIsFavorite(!prev); // Optimistic UI

    try {
      if (prev) {
        await fetchApi(`/users/${currentUser.id}/favorites/${listingId}`, {
          method: "DELETE",
          demoUserId: currentUser.id,
        });
        toast.success("Removed from favorites");
        onChange?.(false);
      } else {
        await fetchApi(`/users/${currentUser.id}/favorites/${listingId}`, {
          method: "POST",
          demoUserId: currentUser.id,
        });
        toast.success("Added to favorites");
        onChange?.(true);
      }
    } catch (error) {
      setIsFavorite(prev); // Revert
      if (error instanceof ApiError && error.status === 409) {
        setIsFavorite(true);
      } else {
        toast.error("Failed to update favorite");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading || userLoading}
      className={`absolute top-3 right-3 p-2 rounded-full transition hover:scale-110 active:scale-95 ${
        isFavorite ? "text-rose-500" : onSurface ? "text-gray-700 hover:bg-gray-100" : "text-white/80 hover:text-white"
      }`}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={`w-6 h-6 drop-shadow-md ${isFavorite ? "fill-current" : ""}`} />
    </button>
  );
}
