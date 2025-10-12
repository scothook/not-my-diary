import { useEffect } from "react";

export function useDebouncedSave<T>(
  values: T[],
  delay: number,
  saveFn: (values: T[]) => void
) {
  useEffect(() => {
    if (values.length === 0) return;
    const handler = setTimeout(() => saveFn(values), delay);
    return () => clearTimeout(handler);
  }, [values, delay, saveFn]);
}
