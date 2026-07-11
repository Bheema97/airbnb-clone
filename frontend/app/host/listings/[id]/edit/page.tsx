"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ListingForm, { ListingMutationPayload } from "@/components/ListingForm";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { ListingCardData, ListingDetailData } from "@/types";

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser, isLoading: userLoading } = useUser();
  const [listing, setListing] = useState<ListingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const isHost = currentUser?.role === "host" || currentUser?.role === "both";
  useEffect(() => {
    if (userLoading) return;
    if (!currentUser || !isHost) { setForbidden(true); setLoading(false); return; }
    Promise.all([
      fetchApi<ListingDetailData>(`/listings/${params.id}`),
      fetchApi<ListingCardData[]>(`/hosts/${currentUser.id}/listings`, { demoUserId: currentUser.id }),
    ]).then(([detail, owned]) => {
      if (!owned.some((item) => item.id === detail.id)) setForbidden(true);
      else setListing(detail);
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load this listing")).finally(() => setLoading(false));
  }, [currentUser, isHost, params.id, userLoading]);
  if (userLoading || loading) return <div className="py-24 text-center text-gray-500">Loading listing details…</div>;
  if (forbidden) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">This listing belongs to another host</h1><p className="mt-3 text-gray-600">Only the owner can view or save this editing form.</p><Link href="/host" className="mt-6 inline-block rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white">Return to your dashboard</Link></div>;
  if (error || !listing || !currentUser) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Listing unavailable</h1><p className="mt-3 text-red-600">{error}</p><Link href="/host" className="mt-6 inline-block font-semibold underline">Back to dashboard</Link></div>;
  const save = async (payload: ListingMutationPayload) => {
    await fetchApi<ListingDetailData>(`/listings/${listing.id}`, { method: "PATCH", demoUserId: currentUser.id, body: JSON.stringify(payload) });
    toast.success("Listing updated");
    router.push("/host"); router.refresh();
  };
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Edit stay</p><h1 className="mt-1 text-3xl font-semibold">Refine {listing.title}</h1><p className="mb-10 mt-3 text-gray-500">Updates are persisted immediately after you save.</p><ListingForm listing={listing} onSubmit={save} submitLabel="Save changes" /></div>;
}
