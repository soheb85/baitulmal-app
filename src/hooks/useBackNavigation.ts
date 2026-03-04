"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function useBackNavigation(defaultPath = "/") {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleBack = (customPath?: string) => {
    setIsNavigating(true);
    // Slight delay to ensure the UI paints before navigation starts
    setTimeout(() => {
      router.push(customPath || defaultPath);
    }, 50);
  };

  return { isNavigating, handleBack };
}