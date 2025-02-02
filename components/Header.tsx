"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="w-full bg-black">
      <div className="container flex h-16 items-center px-4 mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="ReadsAI Logo" width={32} height={32} />
          <span className="text-xl font-bold text-white">ReadsAI</span>
        </div>
        <div className="ml-auto">
          {user ? (
            <Button
              variant="outline"
              className="bg-white border-white text-black hover:bg-black hover:text-white"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          ) : (
            <Button
              variant="outline"
              className="bg-white border-white text-black hover:bg-black hover:text-white"
              onClick={() => router.push("/")}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
