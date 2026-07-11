"use client";

import Link from "next/link";
import Image from "next/image";
import { ListingCardData } from "@/types";
import FavoriteButton from "./FavoriteButton";
import RatingDisplay from "./RatingDisplay";
import PriceDisplay from "./PriceDisplay";
import { useSearchParams } from "next/navigation";

interface ListingCardProps {
  listing: ListingCardData;
  isFavorite?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export default function ListingCard({ listing, isFavorite = false, onFavoriteChange }: ListingCardProps) {
  const searchParams = useSearchParams();
  // We use standard img tags or Next.js Image with unoptimized if URLs are external and domains not configured.
  // We'll use unoptimized Next.js image for Unsplash to avoid needing domain config in next.config.ts
  const imageUrl = listing.cover_image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800";

  return (
    <Link href={`/listings/${listing.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="group flex flex-col gap-3 relative">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
        <Image
          src={imageUrl}
          alt={listing.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <FavoriteButton listingId={listing.id} initialIsFavorite={isFavorite} onChange={onFavoriteChange} />
      </div>
      
      <div className="flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-gray-900 truncate" title={`${listing.city}, ${listing.country}`}>
            {listing.city}, {listing.country}
          </h3>
          <RatingDisplay rating={listing.rating_average} count={listing.review_count} className="flex-shrink-0" />
        </div>
        
        <p className="text-gray-500 text-sm truncate">{listing.title}</p>
        
        <div className="mt-1">
          <PriceDisplay amount={listing.price_per_night} label="night" />
        </div>
      </div>
    </Link>
  );
}
