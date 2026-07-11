import ClientListingGrid from "@/components/ClientListingGrid";
import FilterRow from "@/components/FilterRow";
import Pagination from "@/components/Pagination";
import SearchFilters from "@/components/SearchFilters";
import { fetchApi } from "@/lib/api";
import { PaginatedListings } from "@/types";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ExploreResults({ searchParams, title }: { searchParams: SearchParams; title?: string }) {
  const params = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  });
  if (!params.has("page_size")) params.set("page_size", "12");

  let result: PaginatedListings = { items: [], page: 1, page_size: 12, total_items: 0, total_pages: 0 };
  let error = "";
  try {
    result = await fetchApi<PaginatedListings>(`/listings?${params.toString()}`, { cache: "no-store" });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Unable to load stays";
  }

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{title && <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Explore</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1></div>}<FilterRow /><div className="mt-5 flex items-center justify-between gap-4"><p className="text-sm text-gray-600">{result.total_items ? `${result.total_items} stays match your search` : "Search our curated stays"}</p><SearchFilters /></div>{error ? <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><h2 className="text-lg font-semibold">We could not load these stays</h2><p className="mt-2 text-sm text-red-700">{error}</p></div> : <><div className="mt-7"><ClientListingGrid listings={result.items} /></div><Pagination page={result.page} totalPages={result.total_pages} totalItems={result.total_items} /></>}</div>;
}
