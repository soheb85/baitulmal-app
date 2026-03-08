"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

export function useBackNavigation(fallbackRoute: string = "/beneficiaries") {
  const router = useRouter();
  const pathname = usePathname();

  const [isNavigating, startTransition] = useTransition();

  const handleBack = useCallback(
    (targetRoute?: string) => {
      startTransition(() => {
        const params = new URLSearchParams(window.location.search);

        // 1️⃣ Explicit route override
        if (targetRoute) {
          router.push(targetRoute);
          return;
        }

        // 2️⃣ ReturnTo support (VERY useful)
        const returnTo = params.get("returnTo");
        if (returnTo) {
          router.push(returnTo);
          return;
        }

        // 3️⃣ Edit mode handling
        if (params.get("edit") === "true") {
          params.delete("edit");

          const newUrl = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname;

          router.push(newUrl);
          return;
        }

        // 4️⃣ Default fallback
        router.push(fallbackRoute);
      });
    },
    [router, pathname, fallbackRoute]
  );

  return { isNavigating, handleBack };
}