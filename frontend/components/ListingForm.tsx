"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2 } from "lucide-react";
import { z } from "zod";
import { ApiError, fetchApi } from "@/lib/api";
import { Amenity, ListingDetailData } from "@/types";

const listingSchema = z.object({
  title: z.string().min(5, "Use at least 5 characters").max(200),
  description: z.string().min(20, "Use at least 20 characters"),
  property_type: z.string().min(1, "Choose a property type"),
  room_type: z.string().min(1, "Choose a room type"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State or region is required"),
  country: z.string().min(2, "Country is required"),
  price_per_night: z.number().positive("Price must be positive"),
  cleaning_fee: z.number().min(0, "Cleaning fee cannot be negative"),
  service_fee_percent: z.number().min(0).max(100, "Use a percentage from 0 to 100"),
  max_guests: z.number().int().positive("Capacity must be at least one"),
  bedrooms: z.number().int().min(0),
  beds: z.number().int().positive("At least one bed is required"),
  bathrooms: z.number().min(0.5, "At least half a bathroom is required"),
  images: z.array(z.object({ image_url: z.string().url("Enter a valid image URL"), alt_text: z.string() })).min(1, "Add at least one image"),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export interface ListingMutationPayload {
  title: string;
  description: string;
  property_type: string;
  room_type: string;
  city: string;
  state: string;
  country: string;
  price_per_night: number;
  cleaning_fee: number;
  service_fee_percentage: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenity_ids: number[];
  images: Array<{ image_url: string; alt_text: string; display_order: number }>;
}

const inputClass = "mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500";

export default function ListingForm({ listing, onSubmit, submitLabel }: { listing?: ListingDetailData; onSubmit: (payload: ListingMutationPayload) => Promise<void>; submitLabel: string }) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>(listing?.amenities.map((amenity) => amenity.id) || []);
  const { register, control, handleSubmit, watch, setError, formState: { errors, isDirty, isSubmitting } } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: listing?.title || "",
      description: listing?.description || "",
      property_type: listing?.property_type || "",
      room_type: listing?.room_type || "",
      city: listing?.city || "",
      state: listing?.state || "",
      country: listing?.country || "",
      price_per_night: listing?.price_per_night || 100,
      cleaning_fee: listing?.cleaning_fee || 0,
      service_fee_percent: Number(((listing?.service_fee_percentage || 0.14) * 100).toFixed(2)),
      max_guests: listing?.max_guests || 2,
      bedrooms: listing?.bedrooms || 1,
      beds: listing?.beds || 1,
      bathrooms: listing?.bathrooms || 1,
      images: listing?.images.map((image) => ({ image_url: image.image_url, alt_text: image.alt_text || "" })) || [{ image_url: "", alt_text: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "images" });
  const images = watch("images");
  const initialAmenityIds = listing?.amenities.map((amenity) => amenity.id).sort((a, b) => a - b).join(",") || "";
  const amenitiesDirty = [...selectedAmenityIds].sort((a, b) => a - b).join(",") !== initialAmenityIds;
  const hasUnsavedChanges = isDirty || amenitiesDirty;

  useEffect(() => { fetchApi<Amenity[]>("/amenities").then(setAmenities).catch(() => setAmenities([])); }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (hasUnsavedChanges && !isSubmitting) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, isSubmitting]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({ ...values, amenity_ids: selectedAmenityIds, service_fee_percentage: values.service_fee_percent / 100, images: values.images.map((image, index) => ({ ...image, display_order: index })) });
    } catch (caught) {
      if (caught instanceof ApiError && caught.details?.length) {
        const first = caught.details[0];
        const apiField = first.loc?.findLast((part) => typeof part === "string" && part !== "body");
        const field = apiField === "service_fee_percentage" ? "service_fee_percent" : apiField;
        const knownFields = ["title", "description", "property_type", "room_type", "city", "state", "country", "price_per_night", "cleaning_fee", "service_fee_percent", "max_guests", "bedrooms", "beds", "bathrooms", "images"];
        if (typeof field === "string" && knownFields.includes(field)) {
          setError(field as keyof ListingFormValues, { message: first.msg || caught.message });
          return;
        }
      }
      setError("root.server", { message: caught instanceof Error ? caught.message : "Unable to save this listing" });
    }
  });

  const fieldError = (message?: string) => message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;

  return <form onSubmit={submit} className="space-y-10">
    {errors.root?.server?.message && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{errors.root.server.message}</div>}
    <section><h2 className="text-xl font-semibold">The essentials</h2><p className="mt-1 text-sm text-gray-500">Give guests a clear, original picture of the stay.</p><div className="mt-5 space-y-5"><label className="block text-sm font-semibold">Title<input {...register("title")} className={inputClass} placeholder="Sunlit loft near the river" />{fieldError(errors.title?.message)}</label><label className="block text-sm font-semibold">Description<textarea {...register("description")} rows={6} className={inputClass} placeholder="Describe the atmosphere, layout, and what makes the stay special." />{fieldError(errors.description?.message)}</label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Property type<select {...register("property_type")} className={inputClass}><option value="">Select type</option>{["Apartment", "Villa", "Cabin", "House", "Castle", "Tent"].map((type) => <option key={type}>{type}</option>)}</select>{fieldError(errors.property_type?.message)}</label><label className="text-sm font-semibold">Room type<select {...register("room_type")} className={inputClass}><option value="">Select room</option><option>Entire place</option><option>Private room</option><option>Shared room</option></select>{fieldError(errors.room_type?.message)}</label></div></div></section>
    <section><h2 className="text-xl font-semibold">Location</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">City<input {...register("city")} className={inputClass} />{fieldError(errors.city?.message)}</label><label className="text-sm font-semibold">State or region<input {...register("state")} className={inputClass} />{fieldError(errors.state?.message)}</label><label className="text-sm font-semibold">Country<input {...register("country")} className={inputClass} />{fieldError(errors.country?.message)}</label></div></section>
    <section><h2 className="text-xl font-semibold">Pricing and capacity</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-semibold">Nightly price<input type="number" step="0.01" {...register("price_per_night", { valueAsNumber: true })} className={inputClass} />{fieldError(errors.price_per_night?.message)}</label><label className="text-sm font-semibold">Cleaning fee<input type="number" step="0.01" {...register("cleaning_fee", { valueAsNumber: true })} className={inputClass} />{fieldError(errors.cleaning_fee?.message)}</label><label className="text-sm font-semibold">Service fee %<input type="number" step="0.1" {...register("service_fee_percent", { valueAsNumber: true })} className={inputClass} />{fieldError(errors.service_fee_percent?.message)}</label><label className="text-sm font-semibold">Maximum guests<input type="number" {...register("max_guests", { valueAsNumber: true })} className={inputClass} />{fieldError(errors.max_guests?.message)}</label><label className="text-sm font-semibold">Bedrooms<input type="number" {...register("bedrooms", { valueAsNumber: true })} className={inputClass} />{fieldError(errors.bedrooms?.message)}</label><label className="text-sm font-semibold">Beds<input type="number" {...register("beds", { valueAsNumber: true })} className={inputClass} />{fieldError(errors.beds?.message)}</label><label className="text-sm font-semibold">Bathrooms<input type="number" step="0.5" {...register("bathrooms", { valueAsNumber: true })} className={inputClass} />{fieldError(errors.bathrooms?.message)}</label></div></section>
    <section><h2 className="text-xl font-semibold">Amenities</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{amenities.map((amenity) => <label key={amenity.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" value={amenity.id} checked={selectedAmenityIds.includes(amenity.id)} onChange={(event) => setSelectedAmenityIds((current) => event.target.checked ? [...current, amenity.id] : current.filter((id) => id !== amenity.id))} className="h-4 w-4 accent-rose-500" />{amenity.name}</label>)}</div></section>
    <section><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Photos</h2><p className="mt-1 text-sm text-gray-500">Use stable HTTPS image URLs. The first photo becomes the cover.</p></div><button type="button" onClick={() => append({ image_url: "", alt_text: "" })} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"><ImagePlus className="h-4 w-4" /> Add photo</button></div>{fieldError(errors.images?.root?.message)}<div className="mt-5 space-y-4">{fields.map((field, index) => <div key={field.id} className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-[120px_1fr_auto]"><div className="relative h-24 overflow-hidden rounded-xl bg-gray-100">{images[index]?.image_url?.startsWith("http") ? <Image src={images[index].image_url} alt="Preview" fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">Preview</div>}</div><div className="space-y-3"><label className="text-sm font-semibold">Image URL<input {...register(`images.${index}.image_url`)} className={inputClass} />{fieldError(errors.images?.[index]?.image_url?.message)}</label><label className="text-sm font-semibold">Alt text<input {...register(`images.${index}.alt_text`)} className={inputClass} placeholder="Exterior at sunset" /></label></div><button type="button" onClick={() => remove(index)} disabled={fields.length === 1} className="self-start rounded-full p-2 text-red-600 hover:bg-red-50 disabled:opacity-30" aria-label={`Remove photo ${index + 1}`}><Trash2 className="h-5 w-5" /></button></div>)}</div></section>
    <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t bg-white/95 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between"><Link href="/host" onClick={(event) => { if (hasUnsavedChanges && !window.confirm("Leave without saving your changes?")) event.preventDefault(); }} className="rounded-xl px-5 py-3 text-center font-semibold underline">Back to dashboard</Link><button type="submit" disabled={isSubmitting} className="rounded-xl bg-rose-500 px-7 py-3 font-semibold text-white disabled:opacity-50">{isSubmitting ? "Saving…" : submitLabel}</button></div>
  </form>;
}
