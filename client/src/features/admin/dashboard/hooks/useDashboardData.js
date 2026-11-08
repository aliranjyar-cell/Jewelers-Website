import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDashboard } from "../services/dashboardApi";

const REFETCH_AFTER_MS = 2 * 60 * 1000;

/**
 * Loads dashboard data for a range.
 *  - status: "loading" (first load / range change) | "refreshing" | "ready" | "error"
 *  - on refresh the previous data stays visible; on a range change it resets
 *  - refetches automatically when the tab becomes visible after a few minutes
 */
export default function useDashboardData(range) {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: null,
    updatedAt: null,
  });
  const [tick, setTick] = useState(0);
  const previousRange = useRef(range);
  const updatedRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const rangeChanged = previousRange.current !== range;
    previousRange.current = range;

    setState((s) => ({
      ...s,
      status: rangeChanged || !s.data ? "loading" : "refreshing",
      data: rangeChanged ? null : s.data,
      error: null,
    }));

    fetchDashboard(range, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const updatedAt = Date.now();
        updatedRef.current = updatedAt;
        setState({ status: "ready", data, error: null, updatedAt });
      })
      .catch((error) => {
        if (error?.name === "AbortError" || controller.signal.aborted) return;
        setState((s) => ({ ...s, status: "error", error }));
      });

    return () => controller.abort();
  }, [range, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        updatedRef.current &&
        Date.now() - updatedRef.current > REFETCH_AFTER_MS
      ) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { ...state, refresh };
}
