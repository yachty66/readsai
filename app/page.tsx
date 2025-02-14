"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/SignInModal";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function EpubToAudioConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for stored file data after authentication
    const storedFileName = localStorage.getItem("pendingFile");
    const storedFileData = localStorage.getItem("pendingFileData");

    if (storedFileName && storedFileData) {
      const blob = new Blob([Buffer.from(storedFileData, "base64")], {
        type: "application/epub+zip",
      });
      const file = new File([blob], storedFileName, {
        type: "application/epub+zip",
      });
      setFile(file);
      // Clear storage
      localStorage.removeItem("pendingFile");
      localStorage.removeItem("pendingFileData");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" && file) {
        handleConvert();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/epub+zip") {
      setFile(selectedFile);
    } else {
      alert("Please select a valid ePub file.");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    if (user) {
      try {
        setConverting(true);

        // Redirect to dashboard immediately with the new book name
        router.push(`/dashboard?newBook=${encodeURIComponent(file.name)}`);

        // Upload epub to books folder
        const filePath = `${user.email}/books/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("books")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get and upload the demo audio file in the background
        const audioResponse = await fetch("/audio.mp3");
        const audioBlob = await audioResponse.blob();

        const audioPath = `${user.email}/audiobooks/${file.name.replace(
          ".epub",
          ".mp3"
        )}`;
        await supabase.storage.from("books").upload(audioPath, audioBlob, {
          cacheControl: "3600",
          upsert: false,
        });
      } catch (error) {
        console.error("Error during upload:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setConverting(false);
      }
    } else {
      // Store file data before opening sign-in modal
      const reader = new FileReader();
      reader.onload = () => {
        const base64data = reader.result?.toString().split(",")[1];
        if (base64data) {
          localStorage.setItem("pendingFile", file.name);
          localStorage.setItem("pendingFileData", base64data);
        }
      };
      reader.readAsDataURL(file);
      setShowSignInModal(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-black text-white p-4">
      <div className="w-full max-w-3xl px-4">
        <h1 className="text-3xl font-bold mb-12 text-center">
          ePub to Audio Converter
        </h1>

        <div className="mb-8">
          <label htmlFor="epub-file" className="block mb-4 text-lg font-medium">
            Upload ePub File
          </label>
          {!file ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="epub-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-white border-dashed rounded-lg cursor-pointer hover:bg-gray-900 transition-colors duration-200"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                  <Upload className="w-12 h-12 mb-4" />
                  <p className="mb-2 text-xl">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-sm text-gray-400">ePub files only</p>
                </div>
                <input
                  id="epub-file"
                  type="file"
                  className="hidden"
                  accept=".epub"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="w-full p-6 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-lg font-medium truncate max-w-[500px]">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <Button
          className="w-full mb-6 h-12 text-lg bg-white text-black hover:bg-gray-200"
          onClick={handleConvert}
          disabled={!file || converting}
        >
          {converting ? "Converting..." : "Convert to Audio"}
        </Button>
      </div>

      <SignInModal
        open={showSignInModal}
        onOpenChange={setShowSignInModal}
        file={file}
      />
    </div>
  );
}
