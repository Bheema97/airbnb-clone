"use client";

import Link from "next/link";
import { useUser, User } from "@/lib/user-context";
import { Heart, Home, Plane, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { currentUser, setCurrentUser, users, isLoading } = useUser();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const today = new Date().toISOString().slice(0, 10);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) {
      params.set("location", location.trim());
    }
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests) params.set("guests", guests);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <nav className="fixed top-0 w-full bg-white border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-rose-500 font-bold text-xl flex items-center gap-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              StayFinder
            </Link>
          </div>
          
          {/* Search Bar Desktop */}
          <div className="hidden lg:block">
            <form onSubmit={handleSearch} className="flex items-center divide-x border rounded-full py-1.5 px-2 shadow-sm hover:shadow-md transition bg-white">
              <input
                type="text"
                placeholder="Where to?"
                className="bg-transparent outline-none px-3 text-sm w-36 text-gray-900 placeholder-gray-500 font-medium"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <input aria-label="Check-in" type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-32 bg-transparent px-3 text-xs" />
              <input aria-label="Check-out" type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-32 bg-transparent px-3 text-xs" />
              <select aria-label="Guests" value={guests} onChange={(e) => setGuests(e.target.value)} className="bg-transparent px-3 text-xs"><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option><option value="5">5 guests</option><option value="6">6 guests</option></select>
              <button type="submit" className="bg-rose-500 p-2 rounded-full text-white" aria-label="Search stays">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {currentUser && (
              <>
                <Link href="/trips" className="text-gray-600 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium">Trips</Link>
                <Link href="/favorites" className="text-gray-600 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium">Favorites</Link>
                {(currentUser.role === 'host' || currentUser.role === 'both') && (
                  <Link href="/host" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 rounded-full">Switch to hosting</Link>
                )}
              </>
            )}
            
            <div className="relative ml-2 flex items-center gap-2 border rounded-full px-3 py-2 hover:shadow-md transition">
               <span className="hidden xl:inline text-sm font-medium text-gray-700">Demo:</span>
               <select 
                 className="text-sm outline-none bg-transparent font-medium text-gray-900 cursor-pointer"
                 value={currentUser?.id || ''}
                 onChange={(e) => {
                   const user = users.find((u: User) => u.id === parseInt(e.target.value));
                   if (user) setCurrentUser(user);
                 }}
                 disabled={isLoading}
               >
                 {isLoading && <option>Loading...</option>}
                 {!isLoading && users.map((user: User) => (
                   <option key={user.id} value={user.id}>
                     {user.name} ({user.role})
                   </option>
                 ))}
               </select>
            </div>
          </div>
          
          {/* Mobile Search Button */}
          <div className="md:hidden flex items-center gap-4">
             <Link href="/trips" aria-label="My trips" className="rounded-full p-2 text-gray-700"><Plane className="h-4 w-4" /></Link>
             <Link href="/favorites" aria-label="Favorites" className="rounded-full p-2 text-gray-700"><Heart className="h-4 w-4" /></Link>
             {currentUser && (currentUser.role === "host" || currentUser.role === "both") && <Link href="/host" aria-label="Host dashboard" className="rounded-full border p-2 text-gray-700"><Home className="h-4 w-4" /></Link>}
             <div className="relative flex items-center gap-1 border rounded-full px-2 py-1 bg-gray-50">
               <select 
                 className="text-xs outline-none bg-transparent text-gray-900"
                 value={currentUser?.id || ''}
                 onChange={(e) => {
                   const user = users.find((u: User) => u.id === parseInt(e.target.value));
                   if (user) setCurrentUser(user);
                 }}
               >
                 {users.map((user: User) => (
                   <option key={user.id} value={user.id}>{user.name}</option>
                 ))}
               </select>
             </div>
          </div>
        </div>
        
        {/* Mobile Search Bar Row */}
        <div className="md:hidden pb-4">
           <form onSubmit={handleSearch} className="flex items-center border rounded-full py-2 px-2 shadow-sm bg-white">
              <Search className="w-5 h-5 text-gray-500 ml-2" />
              <input
                type="text"
                placeholder="Where to?"
                className="bg-transparent outline-none px-3 text-sm w-full text-gray-900 font-medium"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button type="submit" className="rounded-full bg-rose-500 p-2 text-white" aria-label="Search"><Search className="h-4 w-4" /></button>
            </form>
        </div>
      </div>
    </nav>
  );
}
