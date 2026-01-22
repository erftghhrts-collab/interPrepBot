"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-4 animate-spin", className)}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  autoLoading?: boolean;
  spinnerClassName?: string;
  loadingText?: React.ReactNode;
};

export function LoadingButton({
  loading,
  autoLoading = true,
  spinnerClassName,
  loadingText,
  className,
  children,
  disabled,
  onClick,
  ...props
}: LoadingButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigationKey = React.useMemo(() => {
    const search = searchParams?.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  const [internalLoading, setInternalLoading] = React.useState(false);
  const clickNavigationKeyRef = React.useRef<string | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const isLoading = loading ?? internalLoading;

  React.useEffect(() => {
    if (!internalLoading) return;
    if (clickNavigationKeyRef.current === null) return;

    if (navigationKey !== clickNavigationKeyRef.current) {
      setInternalLoading(false);
      clickNavigationKeyRef.current = null;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [navigationKey, internalLoading]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const wrappedOnClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    if (disabled || isLoading) return;

    if (autoLoading) {
      setInternalLoading(true);
      clickNavigationKeyRef.current = navigationKey;

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setInternalLoading(false);
        clickNavigationKeyRef.current = null;
        timeoutRef.current = null;
      }, 8000);
    }

    const result = onClick?.(e);

    const maybePromise = result as unknown as Promise<unknown> | undefined;
    if (autoLoading && maybePromise && typeof maybePromise.then === "function") {
      try {
        await maybePromise;
      } finally {
        // If we navigated, the effect above will clear internalLoading.
        // If not, clear it here.
        setInternalLoading(false);
        clickNavigationKeyRef.current = null;
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      onClick={wrappedOnClick}
      className={cn(className, isLoading && "opacity-80")}
    >
      {isLoading && (
        <span className="mr-2 inline-flex items-center" aria-hidden="true">
          <Spinner className={spinnerClassName} />
        </span>
      )}
      {isLoading && loadingText !== undefined ? loadingText : children}
    </Button>
  );
}
