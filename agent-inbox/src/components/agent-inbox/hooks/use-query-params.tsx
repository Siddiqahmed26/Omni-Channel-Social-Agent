import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateQueryParams = React.useCallback(
    (key: string | string[], value?: string | string[]) => {
      if (typeof window === "undefined") return;

      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.search);
      let hasChanged = false;

      if (Array.isArray(key)) {
        if (!Array.isArray(value) || key.length !== value.length) {
          throw new Error(
            "When key is an array, value must also be an array of the same length"
          );
        }

        key.forEach((k, index) => {
          const val = value[index];
          if (val) {
            if (params.get(k) !== val) {
              params.set(k, val);
              hasChanged = true;
            }
          } else {
            if (params.has(k)) {
              params.delete(k);
              hasChanged = true;
            }
          }
        });
      } else {
        if (Array.isArray(value)) {
          throw new Error("When key is a string, value must also be a string");
        }

        if (value) {
          if (params.get(key) !== value) {
            params.set(key, value);
            hasChanged = true;
          }
        } else {
          if (params.has(key)) {
            params.delete(key);
            hasChanged = true;
          }
        }
      }

      if (hasChanged) {
        // Use replace instead of push to avoid breaking the browser's history
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [router, pathname]
  );

  const getSearchParam = React.useCallback(
    (name: string): string | undefined => {
      if (typeof window === "undefined") return;
      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.search);
      return params.get(name) || undefined;
    },
    []
  );

  return { searchParams, updateQueryParams, getSearchParam };
}
