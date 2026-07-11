import { MapPin } from "lucide-react";

interface MapPlaceholderProps {
  city: string;
  country: string;
}

export default function MapPlaceholder({ city, country }: MapPlaceholderProps) {
  return (
    <div className="w-full h-80 bg-[#e5e3df] rounded-xl relative overflow-hidden flex items-center justify-center border">
      {/* Decorative SVG to look like a map */}
      <svg className="absolute inset-0 w-full h-full text-[#d4d1cc]" preserveAspectRatio="none" viewBox="0 0 100 100">
         <path d="M0,50 Q25,20 50,50 T100,50 L100,100 L0,100 Z" fill="currentColor" opacity="0.3"/>
         <path d="M0,70 Q25,90 50,70 T100,70 L100,100 L0,100 Z" fill="currentColor" opacity="0.5"/>
         <path d="M30,0 L30,100 M70,0 L70,100" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
         <path d="M0,30 L100,30 M0,70 L100,70" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
      </svg>
      
      <div className="relative flex flex-col items-center">
        <div className="bg-rose-500 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="mt-2 bg-white px-4 py-2 rounded-full shadow-md font-medium text-gray-900 text-sm">
          {city}, {country}
        </div>
      </div>
    </div>
  );
}
