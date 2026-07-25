import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Section } from "@/components/site/Section";
import { LedgerPreview } from "@/components/site/LedgerPreview";
import { Capabilities } from "@/components/site/Capabilities";
import { Workflow } from "@/components/site/Workflow";
import { WebsiteShowcase } from "@/components/site/WebsiteShowcase";
import { PointsTeaser } from "@/components/site/PointsTeaser";
import { Security } from "@/components/site/Security";
import { Pricing } from "@/components/site/Pricing";
import { FinalCTA } from "@/components/site/FinalCTA";
import { MatrixRain } from "@/components/fx/MatrixRain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodingClerks — Your coding desk, staffed by agents" },
      {
        name: "description",
        content:
          "CodingClerks is an agentic bureau that turns prompts and public URLs into working React apps. Sandboxed builds, live preview, GitHub export, Vercel deployment.",
      },
      { property: "og:title", content: "CodingClerks — Your coding desk, staffed by agents" },
      {
        property: "og:description",
        content:
          "CodingClerks is an agentic bureau that turns prompts and public URLs into working React apps. Sandboxed builds, live preview, GitHub export, Vercel deployment.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <MatrixRain className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.10]" density={1} />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />


        <Section
          id="ledger"
          eyebrow="Desk view"
          title="A ledger you can read, a preview you can share."
          description="Every clerk action streams to a transparent activity log. A live preview spins up beside it within seconds."
        >
          <LedgerPreview />
        </Section>

        <Section
          id="capabilities"
          eyebrow="Capabilities"
          title="The six instruments on every desk."
          description="A focused toolkit for turning intent into shipped React. No filler, no bolt-ons."
        >
          <Capabilities />
        </Section>

        <Section
          id="workflow"
          eyebrow="Workflow"
          title="From brief to production in five movements."
          description="A choreographed handoff between specialized clerks. You watch, comment, and approve."
        >
          <Workflow />
        </Section>

        <Section
          id="websites"
          eyebrow="Specialization"
          title="Built for animated, interactive websites."
          description="Marketing surfaces, editorial docs, launch microsites, and operator dashboards — drafted with the patterns each one deserves."
        >
          <WebsiteShowcase />
        </Section>

        <Section
          id="points"
          eyebrow="Economics"
          title="Coding Points keep the meter honest."
          description="A single, transparent unit for every clerk action. Predictable, line-itemized, never surprising."
        >
          <PointsTeaser />
        </Section>

        <Section
          id="security"
          eyebrow="Trust"
          title="Your code, your keys, your provenance."
          description="CodingClerks is a workshop, not a black box. Everything we make is yours to take, audit, and run."
        >
          <Security />
        </Section>

        <Section
          id="pricing"
          eyebrow="Pricing"
          title="Open a desk, scale a bureau."
          description="Start free. Add seats as the bureau grows. Bring your own model keys at the atelier tier."
        >
          <Pricing />
        </Section>

        <FinalCTA />
      </main>
      <Footer />
      </div>
    </div>
  );
}
