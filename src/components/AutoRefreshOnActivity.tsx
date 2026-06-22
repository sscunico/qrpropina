"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  initialVersion: string;
};

export function AutoRefreshOnActivity({ initialVersion }: Props) {
  const router = useRouter();
  const versionRef = useRef(initialVersion);
  const refreshingRef = useRef(false);

  useEffect(() => {
    versionRef.current = initialVersion;
  }, [initialVersion]);

  useEffect(() => {
    async function checkActivity() {
      if (document.visibilityState !== "visible" || refreshingRef.current) {
        return;
      }

      try {
        const response = await fetch("/api/activity/version", {
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { version?: string | null };
        if (data.version && data.version !== versionRef.current) {
          versionRef.current = data.version;
          refreshingRef.current = true;
          router.refresh();
          window.setTimeout(() => {
            refreshingRef.current = false;
          }, 1200);
        }
      } catch {
        // La consulta es auxiliar; si falla, la navegación normal sigue funcionando.
      }
    }

    const interval = window.setInterval(checkActivity, 3000);
    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
