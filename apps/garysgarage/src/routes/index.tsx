import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gary's Garage — Honest Auto Repair" },
      { name: "description", content: "Gary's Garage: friendly, honest auto repair and maintenance." },
      { property: "og:title", content: "Gary's Garage — Honest Auto Repair" },
      { property: "og:description", content: "Friendly, honest auto repair and maintenance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const services = ["Oil Changes", "Brakes", "Tires", "Engine Repair"];

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-primary px-6 py-20 text-center text-primary-foreground">
        <h1 className="text-5xl font-black uppercase tracking-tight">Gary's Garage</h1>
        <p className="mt-4 text-lg opacity-80">Honest repairs. Fair prices. Done right.</p>
      </section>
      <section className="mx-auto grid max-w-3xl grid-cols-2 gap-4 px-6 py-12">
        {services.map((s) => (
          <div key={s} className="rounded-lg border bg-card p-6 text-center font-semibold">
            {s}
          </div>
        ))}
      </section>
    </main>
  );
}
