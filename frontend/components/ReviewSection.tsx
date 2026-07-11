"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { ReviewData } from "@/types";

export default function ReviewSection({ listingId }: { listingId: number }) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  useEffect(() => { fetchApi<ReviewData[]>(`/listings/${listingId}/reviews`).then(setReviews).catch(() => setReviews([])); }, [listingId]);
  if (!reviews.length) return <p className="text-gray-500">No reviews yet. This stay is ready for its first guest.</p>;
  return <div className="grid gap-6 sm:grid-cols-2">{reviews.map((review) => <article key={review.id}><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 font-semibold text-rose-700">{review.author?.name?.charAt(0) || "G"}</div><div><p className="font-semibold">{review.author?.name || "Guest"}</p><p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p></div></div><div className="mt-3 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-gray-900" : "text-gray-300"}`} />)}</div><p className="mt-2 leading-6 text-gray-700">{review.comment}</p></article>)}</div>;
}
