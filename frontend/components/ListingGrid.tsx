import ListingCard from "@/components/ListingCard";
import { ListingCardData } from "@/types";

interface ListingGridProps {
  listings: ListingCardData[];
  userFavorites?: number[]; // Array of listing IDs that are favorited by the current user
  onFavoriteChange?: (listingId: number, isFavorite: boolean) => void;
}

export default function ListingGrid({ listings, userFavorites = [], onFavoriteChange }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No exact matches</h3>
        <p className="text-gray-500">Try changing or removing some of your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-10">
      {listings.map((listing) => (
        <ListingCard 
          key={listing.id} 
          listing={listing} 
          isFavorite={userFavorites.includes(listing.id)} 
          onFavoriteChange={(isFavorite) => onFavoriteChange?.(listing.id, isFavorite)}
        />
      ))}
    </div>
  );
}
