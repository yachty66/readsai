"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface Book {
  name: string;
  path: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-gray-800 p-4">
        <Button
          variant="outline"
          className="w-full bg-white text-black hover:bg-gray-100 flex items-center gap-2"
          onClick={() => router.push("/")}
        >
          <Plus className="w-4 h-4" />
          New Conversion
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-black p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Your Books</h1>

        {books.length === 0 ? (
          <div className="text-gray-400">No books yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.name}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center"
              >
                <div className="w-32 h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-600" />
                </div>
                <p className="text-white text-center font-medium">
                  {book.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
