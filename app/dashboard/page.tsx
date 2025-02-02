"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Download, Loader2 } from "lucide-react";

interface Book {
  name: string;
  path: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [user, setUser] = useState<any>(null);
  const [convertingBooks, setConvertingBooks] = useState<Set<string>>(
    new Set()
  );

  // Listen for new book uploads via URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newBook = params.get("newBook");

    if (newBook) {
      // Add the new book to the list immediately
      setBooks((prev) => [...prev, { name: newBook }]);
      setConvertingBooks((prev) => new Set(prev).add(newBook));

      // Clean up URL
      router.replace("/dashboard", undefined, { shallow: true });
    }
  }, [router]);

  const fetchBooks = async (userEmail: string) => {
    const { data: booksData, error: booksError } = await supabase.storage
      .from("books")
      .list(`${userEmail}/books`);

    if (booksError) {
      console.error("Error fetching books:", booksError);
      return;
    }

    // Check which books have audio available
    const booksWithAudioStatus = await Promise.all(
      (booksData || []).map(async (book) => {
        const { data: audioData } = await supabase.storage
          .from("books")
          .list(`${userEmail}/audiobooks`, {
            search: book.name.replace(".epub", ".mp3"),
          });

        if (audioData && audioData.length > 0) {
          // Remove from converting state if audio exists
          setConvertingBooks((prev) => {
            const newSet = new Set(prev);
            newSet.delete(book.name);
            return newSet;
          });
        }
        return book;
      })
    );

    setBooks(booksWithAudioStatus || []);
  };

  // Add polling for conversion status
  useEffect(() => {
    if (convertingBooks.size > 0) {
      const interval = setInterval(() => {
        if (user?.email) {
          fetchBooks(user.email);
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [convertingBooks, user?.email]);

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
      await fetchBooks(session.user.email);
    };

    checkAuth();

    // Subscribe to storage changes
    const channel = supabase
      .channel("storage-changes")
      .on("postgres_changes", { event: "*", schema: "storage" }, () => {
        if (user?.email) {
          fetchBooks(user.email);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [router, user?.email]);

  const handleDownloadAudio = async (bookName: string) => {
    if (!user) return;

    const audioFileName = bookName.replace(".epub", ".mp3");
    const audioPath = `${user.email}/audiobooks/${audioFileName}`;

    const { data, error } = await supabase.storage
      .from("books")
      .download(audioPath);

    if (error) {
      console.error("Error downloading audio:", error);
      return;
    }

    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = audioFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const checkAudioExists = async (bookName: string) => {
    if (!user) return false;

    const audioFileName = bookName.replace(".epub", ".mp3");
    const audioPath = `${user.email}/audiobooks/${audioFileName}`;

    try {
      const { data } = await supabase.storage
        .from("books")
        .list(`${user.email}/audiobooks`, {
          search: audioFileName,
        });

      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking audio:", error);
      return false;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-white/10 p-4">
        <Button
          className="w-full bg-white text-black hover:bg-black hover:text-white hover:border-white border transition-all"
          onClick={() => router.push("/")}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Conversion
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-black p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Your Books</h1>
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
              {convertingBooks.has(book.name) ? (
                <Button
                  disabled
                  className="w-full bg-white/10 text-white border border-white/10"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </Button>
              ) : (
                <Button
                  onClick={() => handleDownloadAudio(book.name)}
                  className="w-full bg-white text-black hover:bg-black hover:text-white hover:border-white border transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Audio
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
