import { notFound } from "next/navigation";
import ListingDetailClient from "@/components/ListingDetailClient";
import { ApiError, fetchApi } from "@/lib/api";
import { ListingDetailData } from "@/types";

export default async function ListingPage({ params }: { params: { id: string } }) {
  let listing: ListingDetailData | null = null;

  try {
    listing = await fetchApi<ListingDetailData>(`/listings/${params.id}`, { cache: "no-store" });
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 404) notFound();
  }

  if (!listing) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">We couldn&apos;t load this stay</h1><p className="mt-3 text-gray-600">Check the API configuration and try again.</p></div>;
  }

  return <ListingDetailClient listing={listing} />;
}
