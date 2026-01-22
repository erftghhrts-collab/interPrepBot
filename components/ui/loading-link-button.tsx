"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LoadingButton, type LoadingButtonProps } from "@/components/ui/loading-button";

export type LoadingLinkButtonProps = Omit<LoadingButtonProps, "onClick"> & {
  href: string;
  replace?: boolean;
  scroll?: boolean;
};

export function LoadingLinkButton({ href, replace, scroll, ...props }: LoadingLinkButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigationKey = React.useMemo(() => {
    const search = searchParams?.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  const clickNavigationKeyRef = React.useRef<string | null>(null);
  const unlockTimeoutRef = React.useRef<number | null>(null);

  const lockPointerEvents = React.useCallback(() => {
    document.body.style.pointerEvents = "none";
  }, []);

  const unlockPointerEvents = React.useCallback(() => {
    document.body.style.pointerEvents = "";
  }, []);

  React.useEffect(() => {
    if (clickNavigationKeyRef.current === null) return;

    if (navigationKey !== clickNavigationKeyRef.current) {
      clickNavigationKeyRef.current = null;
      if (unlockTimeoutRef.current) {
        window.clearTimeout(unlockTimeoutRef.current);
        unlockTimeoutRef.current = null;
      }
      unlockPointerEvents();
    }
  }, [navigationKey, unlockPointerEvents]);

  React.useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) window.clearTimeout(unlockTimeoutRef.current);
      unlockPointerEvents();
    };
  }, [unlockPointerEvents]);

  return (
    <LoadingButton
      {...props}
      onClick={() => {
        lockPointerEvents();
        clickNavigationKeyRef.current = navigationKey;

        if (unlockTimeoutRef.current) window.clearTimeout(unlockTimeoutRef.current);
        unlockTimeoutRef.current = window.setTimeout(() => {
          clickNavigationKeyRef.current = null;
          unlockTimeoutRef.current = null;
          unlockPointerEvents();
        }, 8000);

        if (replace) {
          router.replace(href, { scroll });
        } else {
          router.push(href, { scroll });
        }
      }}
    />
  );
}
