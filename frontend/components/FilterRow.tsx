"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Home, Castle, Tent, Building2, Trees } from "lucide-react";

const CATEGORIES = [
  { label: "All", value: "", icon: Home },
  { label: "Apartment", value: "Apartment", icon: Building2 },
  { label: "Villa", value: "Villa", icon: Home },
  { label: "Cabin", value: "Cabin", icon: Trees },
  { label: "Castle", value: "Castle", icon: Castle },
  { label: "Tent", value: "Tent", icon: Tent },
];

export default function FilterRow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPropertyType = searchParams.get("property_type") || "";

  const handleCategoryClick = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("property_type", value);
      } else {
        params.delete("property_type");
      }
      params.delete("page"); // reset pagination
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex items-center gap-6 overflow-x-auto pb-4 pt-2 no-scrollbar border-b border-gray-100">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = currentPropertyType === cat.value;
        return (
          <button
            key={cat.label}
            onClick={() => handleCategoryClick(cat.value)}
            className={`flex flex-col items-center gap-2 min-w-max transition border-b-2 pb-2 hover:text-gray-900 hover:border-gray-300 ${
              isActive
                ? "text-gray-900 border-gray-900"
                : "text-gray-500 border-transparent"
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
