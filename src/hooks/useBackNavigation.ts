"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function useBackNavigation(fallbackRoute: string = "/beneficiaries") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // useTransition is essential for preventing the "recursion" feel 
  // because it coordinates the UI state with the route change.
  const [isNavigating, startTransition] = useTransition();

  const handleBack = useCallback((targetRoute?: string) => {
    startTransition(() => {
      // SCENARIO 1: Explicit target provided
      if (targetRoute) {
        router.push(targetRoute);
        return;
      }

      // SCENARIO 2: We are in Edit Mode (?edit=true)
      // Goal: Strip the 'edit' param and show the Details View.
      if (searchParams.get("edit") === "true") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("edit");
        
        // Use the current pathname without the edit parameter
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        
        // We use .push here so that 'Details View' becomes the new 'Back' target
        router.push(newUrl);
        return;
      }

      // SCENARIO 3: We are in Details View (No edit param)
      // Goal: Always go back to the Main List (fallbackRoute).
      // Do NOT use router.back() here, as it might point back to the Edit page.
      router.push(fallbackRoute);
    });
  }, [router, pathname, searchParams, fallbackRoute]);

  return { isNavigating, handleBack };
}