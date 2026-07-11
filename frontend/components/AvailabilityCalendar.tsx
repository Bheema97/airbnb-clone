"use client";

import { useEffect, useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { addDays, isBefore, startOfDay, parseISO } from "date-fns";
import { fetchApi } from "@/lib/api";
import { AvailabilityData } from "@/types";
import { toast } from "sonner";

interface AvailabilityCalendarProps {
  listingId: number;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export default function AvailabilityCalendar({ listingId, dateRange, onDateRangeChange }: AvailabilityCalendarProps) {
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    fetchApi<AvailabilityData>(`/listings/${listingId}/availability`)
      .then((data) => {
        const disabled: Date[] = [];
        
        const addRange = (startStr: string, endStr: string) => {
          let current = startOfDay(parseISO(startStr));
          const end = startOfDay(parseISO(endStr));
          
          while (isBefore(current, end)) {
            disabled.push(current);
            current = addDays(current, 1);
          }
        };

        data.booked_ranges.forEach((range) => addRange(range.start, range.end));
        data.blocked_ranges.forEach((range) => addRange(range.start, range.end));
        
        setDisabledDates(disabled);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load availability"))
      .finally(() => setIsLoading(false));
  }, [listingId]);

  // Prevent selecting ranges that include disabled dates
  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onDateRangeChange(undefined);
      return;
    }

    if (range.from && range.to) {
      const hasConflict = disabledDates.some((date) => date >= startOfDay(range.from!) && date < startOfDay(range.to!));

      if (hasConflict) {
        // If conflict, reset to just the start date
        onDateRangeChange({ from: range.from, to: undefined });
        toast.error("Your stay cannot include an unavailable night");
        return;
      }
    } else if (range.from && disabledDates.some((date) => date.getTime() === startOfDay(range.from!).getTime())) {
      toast.error("That night is unavailable");
      onDateRangeChange(undefined);
      return;
    }
    
    onDateRangeChange(range);
  };

  if (isLoading) {
    return <div className="h-[300px] flex items-center justify-center text-gray-500">Loading availability...</div>;
  }
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-semibold">Availability is temporarily unavailable</p><p className="mt-1 text-sm text-red-700">{error}</p></div>;

  return (
    <div id="availability-calendar" className="calendar-container scroll-mt-32">
      <DayPicker
        mode="range"
        selected={dateRange}
        onSelect={handleSelect}
        numberOfMonths={2}
        pagedNavigation
        disabled={{ before: new Date() }}
        modifiers={{ unavailable: disabledDates }}
        classNames={{
          selected: "bg-gray-900 text-white hover:bg-gray-800",
          range_middle: "bg-gray-100 text-gray-900",
          range_start: "bg-gray-900 text-white rounded-l-full",
          range_end: "bg-gray-900 text-white rounded-r-full",
          today: "font-bold text-rose-500",
        }}
        modifiersClassNames={{ unavailable: "text-gray-300 line-through" }}
      />
    </div>
  );
}
