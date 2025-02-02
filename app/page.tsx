"use client";

import { useState } from "react";
import { Upload, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EpubToAudioConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/epub+zip") {
      setFile(selectedFile);
    } else {
      alert("Please select a valid ePub file.");
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    // Simulating conversion process
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setConverting(false);
    setAudioUrl("/sample-audio.mp3"); // Replace with actual converted audio URL
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
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="epub-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-white border-dashed rounded-lg cursor-pointer hover:bg-gray-900 transition-colors duration-200"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                <Upload className="w-12 h-12 mb-4" />
                <p className="mb-2 text-xl">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
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
        </div>

        {file && (
          <p className="mb-6 text-lg text-center">Selected file: {file.name}</p>
        )}

        <Button
          className="w-full mb-6 h-12 text-lg"
          onClick={handleConvert}
          disabled={!file || converting}
        >
          {converting ? "Converting..." : "Convert to Audio"}
        </Button>

        {audioUrl && (
          <div className="text-center">
            <a
              href={audioUrl}
              download
              className="inline-flex items-center text-lg text-white hover:underline"
            >
              <Headphones className="w-6 h-6 mr-2" />
              Download Audio
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
