import { createFileRoute } from "@tanstack/react-router";
import { ParkingLot } from "@/components/game/ParkingLot";

export const Route = createFileRoute("/park")({
  head: () => ({
    meta: [
      { title: "Parking Lot - Sonny's Games" },
      { name: "description", content: "Park the right number of cars." },
    ],
  }),
  component: ParkingLot,
});
