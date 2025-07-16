import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface SmartRefreshOptions {
  queryKeys: string[][];
  staleTime?: number;
  backgroundRefreshInterval?: number;
  onlyWhenStale?: boolean;
  enableBackgroundRefresh?: boolean;
}

export const useSmartRefresh = ({
  queryKeys,
  staleTime = 5 * 60 * 1000, // 5 minutes
  backgroundRefreshInterval = 30 * 60 * 1000, // 30 minutes
  onlyWhenStale = true,
  enableBackgroundRefresh = false, // Disable by default
}: SmartRefreshOptions) => {
  const queryClient = useQueryClient();
  const lastRefreshTime = useRef<number>(0);
  const isActiveTab = useRef<boolean>(true);

  // Check if data is stale
  const isDataStale = useCallback(() => {
    const now = Date.now();
    return now - lastRefreshTime.current > staleTime;
  }, [staleTime]);

  // Silent smart refresh function
  const smartRefresh = useCallback(async () => {
    if (onlyWhenStale && !isDataStale()) {
      return;
    }

    try {
      // Silently invalidate queries without user notification
      const promises = queryKeys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey, exact: false })
      );
      await Promise.all(promises);
      lastRefreshTime.current = Date.now();
    } catch (error) {
      // Silent error handling - no user notification
    }
  }, [queryClient, queryKeys, onlyWhenStale, isDataStale]);

  // Handle visibility change (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        isActiveTab.current = true;
        // Only refresh if user has been away for more than 15 minutes
        if (Date.now() - lastRefreshTime.current > 15 * 60 * 1000) {
          smartRefresh();
        }
      } else {
        isActiveTab.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [smartRefresh]);

  // Background refresh when app is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (isActiveTab.current && isDataStale()) {
        smartRefresh();
      }
    }, backgroundRefreshInterval);

    return () => clearInterval(interval);
  }, [smartRefresh, backgroundRefreshInterval, isDataStale]);

  // Initialize last refresh time
  useEffect(() => {
    lastRefreshTime.current = Date.now();
  }, []);

  return { smartRefresh, isDataStale };
};
