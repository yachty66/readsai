"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      setUser(session.user);

      // Fetch books from storage
      const { data, error } = await supabase.storage
        .from("books")
        .list(`${session.user.email}/books`);

      if (error) {
        console.error("Error fetching books:", error);
        return;
      }

      setBooks(data || []);
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-black text-white p-4">
      <div className="w-full max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Your Conversions</h1>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Conversions</h2>
              <Button
                variant="outline"
                className="bg-white text-black hover:bg-gray-100"
                onClick={() => router.push("/")}
              >
                New Conversion
              </Button>
            </div>
            {books.length === 0 ? (
              <p className="text-gray-400">No conversions yet</p>
            ) : (
              <div className="space-y-4">
                {books.map((book) => (
                  <div key={book.name} className="p-4 bg-gray-800 rounded-lg">
                    <p className="font-medium">{book.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
