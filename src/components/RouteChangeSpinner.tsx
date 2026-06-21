"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function shouldShowForLink(anchor: HTMLAnchorElement, currentUrl: URL) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const nextUrl = new URL(anchor.href, window.location.href);
  if (nextUrl.origin !== window.location.origin) return false;
  if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return false;

  return true;
}

export function RouteChangeSpinner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function startLoading(timeoutMs = 8000) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setIsLoading(true);
      timeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        timeoutRef.current = null;
      }, timeoutMs);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;

      if (shouldShowForLink(target, new URL(window.location.href))) {
        startLoading();
      }
    }

    function handleSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) return;
      if (!(event.target instanceof HTMLFormElement)) return;

      const action = event.target.getAttribute("action");
      if (!action || action.startsWith("javascript:")) return;

      const nextUrl = new URL(event.target.action, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      startLoading(5000);
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="route-spinner-overlay" aria-live="polite" aria-busy="true">
      <div className="page-spinner" aria-hidden="true" />
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
