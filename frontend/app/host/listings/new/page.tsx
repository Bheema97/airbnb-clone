"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ListingForm, { ListingMutationPayload } from "@/components/ListingForm";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { ListingDetailData } from "@/types";

export default function NewListingPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useUser();
  const isHost = currentUser?.role === "host" || currentUser?.role === "both";
  if (isLoading) return <div className="py-24 text-center text-gray-500">Preparing your listing…</div>;
  if (!currentUser || !isHost) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Host access required</h1><p className="mt-3 text-gray-600">Switch to a host demo user before creating a listing.</p><Link href="/host" className="mt-6 inline-block rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white">Back to hosting</Link></div>;
  const save = async (payload: ListingMutationPayload) => {
    await fetchApi<ListingDetailData>("/listings", { method: "POST", demoUserId: currentUser.id, body: JSON.stringify(payload) });
    toast.success("Listing created");
    router.push("/host"); router.refresh();
  };
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">New stay</p><h1 className="mt-1 text-3xl font-semibold">Create a listing guests will remember</h1><p className="mb-10 mt-3 text-gray-500">Complete the essentials now; you can refine everything later.</p><ListingForm onSubmit={save} submitLabel="Create listing" /></div>;
}
