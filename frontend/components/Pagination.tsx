"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ page, totalPages, totalItems }: { page: number; totalPages: number; totalItems: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goTo = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`?${params.toString()}`);
  };
  if (totalPages <= 1) return null;
  return <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Listing pages"><button onClick={() => goTo(page - 1)} disabled={page <= 1} className="rounded-full border p-3 disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><span className="text-sm text-gray-600">Page <strong>{page}</strong> of {totalPages} · {totalItems} stays</span><button onClick={() => goTo(page + 1)} disabled={page >= totalPages} className="rounded-full border p-3 disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></nav>;
}
