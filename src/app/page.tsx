"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + 100 / 60; // 60 steps over 3 seconds
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Redirect when loading reaches 100%
  useEffect(() => {
    if (loadingProgress >= 100) {
      router.push("/profiles");
    }
  }, [loadingProgress, router]);

  const segmentStyle = {
    backgroundImage:
      "repeating-linear-gradient(to right, white, white 10px, transparent 10px, transparent 12px)",
    backgroundSize: "12px 100%",
    width: `${loadingProgress}%`,
  };

  const winBlue = "rgb(0, 0, 128)";

  return (
    <div
      style={{ backgroundColor: winBlue }}
      className="flex min-h-screen flex-col items-center justify-center font-sans text-white"
    >
      {/* Logo */}
      <div className="mt-24">
        <Image
          src="/main_logo.png"
          alt="KP Logo"
          width={500}
          height={500}
          priority
          className="w-[500px] h-auto"
        />
      </div>

      {/* Loading Bar */}
      <div className="w-[400px] mt-24 mb-3">
        <div className="h-6 border border-white p-0.5 bg-black/50 shadow-inner">
          <div
            style={segmentStyle}
            className="h-full overflow-hidden transition-all duration-50"
          />
        </div>
      </div>

      {/* Status Text */}
      <p className="text-lg tracking-wide mt-2">
        {loadingProgress < 100 ? "Starting up..." : "Load Complete"}
      </p>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs">
        <p className="font-bold">PortfolioOS</p>
        <p>© {new Date().getFullYear()} KP. All rights reserved.</p>
      </div>
    </div>
  );
}
