import { useEffect, useState } from "react";

/** Returns Date.now(), refreshed on an interval so "5m ago" labels stay current. */
export default function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
