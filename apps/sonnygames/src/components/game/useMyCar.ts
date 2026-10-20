import { DEFAULT_CAR, GARAGE, type GarageCar } from "@/lib/content";
import { useProgress } from "@/lib/progress";

/** The car Sonny picked in the garage (falls back to the first car). */
export function useMyCar(): GarageCar {
  const { selectedCar } = useProgress();
  return GARAGE.find((c) => c.id === selectedCar) ?? DEFAULT_CAR;
}
