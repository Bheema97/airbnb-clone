"use client";

import { FormEvent, useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Amenity } from "@/types";

export default function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchApi<Amenity[]>("/amenities").then(setAmenities).catch(() => setAmenities([]));
  }, []);

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    const fields = ["location", "check_in", "check_out", "guests", "min_price", "max_price", "property_type", "min_rating", "sort"];
    fields.forEach((field) => {
      const value = String(form.get(field) || "").trim();
      if (value) params.set(field, value);
      else params.delete(field);
    });
    const selectedAmenities = form.getAll("amenities").map(String);
    if (selectedAmenities.length) params.set("amenities", selectedAmenities.join(","));
    else params.delete("amenities");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const selectedAmenities = new Set((searchParams.get("amenities") || "").split(",").filter(Boolean));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-300 px-4 text-sm font-semibold hover:border-gray-900"
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40 p-0 sm:flex sm:items-center sm:justify-center sm:p-6" onMouseDown={() => setOpen(false)}>
          <form
            onSubmit={apply}
            onMouseDown={(event) => event.stopPropagation()}
            className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:static sm:w-full sm:max-w-3xl sm:rounded-3xl"
          >
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-semibold">Find your ideal stay</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close filters"><X /></button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">Where
                <input name="location" defaultValue={searchParams.get("location") || ""} placeholder="City or country" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Check-in<input type="date" min={today} name="check_in" defaultValue={searchParams.get("check_in") || ""} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal" /></label>
                <label className="text-sm font-semibold">Check-out<input type="date" min={today} name="check_out" defaultValue={searchParams.get("check_out") || ""} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal" /></label>
              </div>
              <label className="text-sm font-semibold">Guests
                <input type="number" min="1" name="guests" defaultValue={searchParams.get("guests") || ""} placeholder="Any" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">Property type
                <select name="property_type" defaultValue={searchParams.get("property_type") || ""} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"><option value="">Any type</option>{["Apartment", "Villa", "Cabin", "Castle", "Tent"].map((type) => <option key={type}>{type}</option>)}</select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Min price<input type="number" min="0" name="min_price" defaultValue={searchParams.get("min_price") || ""} placeholder="$0" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
                <label className="text-sm font-semibold">Max price<input type="number" min="0" name="max_price" defaultValue={searchParams.get("max_price") || ""} placeholder="No max" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
              </div>
              <label className="text-sm font-semibold">Minimum rating
                <select name="min_rating" defaultValue={searchParams.get("min_rating") || ""} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"><option value="">Any rating</option><option value="4">4.0+</option><option value="4.5">4.5+</option><option value="4.8">4.8+</option></select>
              </label>
              <label className="text-sm font-semibold">Sort by
                <select name="sort" defaultValue={searchParams.get("sort") || "recommended"} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"><option value="recommended">Recommended</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option></select>
              </label>
            </div>
            <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold">Amenities</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{amenities.map((amenity) => <label key={amenity.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" name="amenities" value={amenity.id} defaultChecked={selectedAmenities.has(String(amenity.id))} className="h-4 w-4 accent-rose-500" />{amenity.name}</label>)}</div></fieldset>
            <div className="sticky bottom-0 mt-6 flex items-center justify-between border-t bg-white pt-5">
              <button type="button" onClick={() => { router.push(pathname); setOpen(false); }} className="font-semibold underline">Clear all</button>
              <button type="submit" className="rounded-xl bg-gray-900 px-7 py-3 font-semibold text-white">Show stays</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
