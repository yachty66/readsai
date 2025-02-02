"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Download } from "lucide-react";

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

  const handleDownloadAudio = async (bookName: string) => {
    if (!user) return;

    const audioFileName = bookName.replace(".epub", ".mp3");
    const audioPath = `${user.email}/audiobooks/${audioFileName}`;

    const { data, error } = await supabase.storage
      .from("books")
      .download(audioPath);

    if (error) {
      console.error("Error downloading audio:", error);
      alert("Audio file not ready yet");
      return;
    }

    // Create download link
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = audioFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-white/10 p-4">
        <Button
          className="w-full bg-white text-black hover:bg-black hover:text-white hover:border-white border transition-all"
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
          <div className="text-white/60">No books yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.name}
                className="border border-white/10 rounded-lg p-6 flex flex-col items-center hover:border-white/30 transition-all"
              >
                <div className="w-32 h-48 border border-white/10 rounded-lg mb-4 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-white/40" />
                </div>
                <p className="text-white text-center font-medium mb-4">
                  {book.name}
                </p>
                <Button
                  onClick={() => handleDownloadAudio(book.name)}
                  className="w-full bg-white text-black hover:bg-black hover:text-white hover:border-white border transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Audio
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
