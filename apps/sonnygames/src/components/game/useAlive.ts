import { useEffect, useRef } from "react";

/** A ref that is true while the component is mounted - use it to stop async sequences after leaving. */
export function useAlive() {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return alive;
}
