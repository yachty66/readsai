import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full bg-black">
      <div className="container flex h-16 items-center px-4 mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="ReadsAI Logo" width={32} height={32} />
          <span className="text-xl font-bold text-white">ReadsAI</span>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            className="bg-white border-white text-black hover:bg-black hover:text-white"
          >
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
