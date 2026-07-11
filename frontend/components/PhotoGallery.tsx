"use client";

import Image from "next/image";
import { ListingImage } from "@/types";

interface PhotoGalleryProps {
  images: ListingImage[];
}

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[2/1] bg-gray-200 rounded-xl flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  // Sort by display order
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const heroImage = sorted[0];
  const gridImages = sorted.slice(1, 5);

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[2/1] rounded-xl overflow-hidden flex gap-2">
      {/* Hero Image */}
      <div className={`relative w-full ${gridImages.length > 0 ? "md:w-1/2" : ""} h-full bg-gray-200 hover:opacity-90 transition`}>
        <Image 
          src={heroImage.image_url} 
          alt={heroImage.alt_text || "Listing photo"} 
          fill 
          unoptimized
          className="object-cover" 
        />
      </div>

      {/* Grid Images (Desktop only) */}
      {gridImages.length > 0 && (
        <div className="hidden md:grid w-1/2 grid-cols-2 grid-rows-2 gap-2">
          {gridImages.map((img, i) => (
            <div key={img.id} className="relative w-full h-full bg-gray-200 hover:opacity-90 transition">
              <Image 
                src={img.image_url} 
                alt={img.alt_text || `Listing photo ${i + 2}`} 
                fill 
                unoptimized
                className="object-cover" 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
