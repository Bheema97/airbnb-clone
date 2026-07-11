import type { Metadata } from "next";
import "./globals.css";
import "react-day-picker/dist/style.css";
import { UserProvider } from "@/lib/user-context";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "StayFinder",
  description: "Find your next stay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900 bg-white">
        <UserProvider>
          <Navbar />
          <main className="min-h-screen pt-[120px] md:pt-20">
            {children}
          </main>
          <Footer />
          <Toaster richColors position="top-right" />
        </UserProvider>
      </body>
    </html>
  );
}
