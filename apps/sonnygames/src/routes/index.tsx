import { Link, createFileRoute } from "@tanstack/react-router";
import { Clouds, StarChip } from "@/components/game/GameShell";
import { Ghost } from "@/components/game/Ghost";
import { ContinueButton } from "@/components/game/ContinueButton";
import { ParentPanel } from "@/components/game/ParentPanel";
import { SportsCar } from "@/components/game/SportsCar";
import { useMyCar } from "@/components/game/useMyCar";
import { say, sfx } from "@/lib/audio";
import type { CarStyle } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sonny's Games" },
      {
        name: "description",
        content:
          "Soccer, cars, ghosts, letters, words, rhymes, counting and patterns - a fun learning game for Sonny John.",
      },
      { property: "og:title", content: "Sonny's Games" },
      {
        property: "og:description",
        content:
          "Soccer, cars, ghosts, letters, words, rhymes, counting and patterns - a fun learning game for Sonny John.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://sonnygames.lovable.app/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://sonnygames.lovable.app/og.png" },
    ],
  }),
  component: Index,
});

type Tile = {
  to:
    | "/letters"
    | "/ghosts"
    | "/soccer"
    | "/carshow"
    | "/numbers"
    | "/patterns"
    | "/goalspell"
    | "/words"
    | "/count"
    | "/park"
    | "/more"
    | "/traffic"
    | "/people"
    | "/police"
    | "/sailor"
    | "/musician"
    | "/foodie"
    | "/sleeping"
    | "/dinosaur"
    | "/vocab"
    | "/safari"
    | "/opposites"
    | "/rhymes"
    | "/memory"
    | "/findit"
    | "/places"
    | "/photomatch"
    | "/rhymematch"
    | "/balloons"
    | "/wordtrain"
    | "/boat"
    | "/plane"
    | "/sequence"
    | "/missing"
    | "/world"
    | "/garage";
  label: string;
  icon: string;
  gradient: string;
  car: { color: string; style: CarStyle };
};

const TILES: Tile[] = [
  {
    to: "/letters",
    label: "ABC Race",
    icon: "🏁",
    gradient: "from-rose-400 to-rose-600",
    car: { color: "#facc15", style: "wedge" },
  },
  {
    to: "/words",
    label: "Word Garage",
    icon: "🔤",
    gradient: "from-violet-400 to-violet-600",
    car: { color: "#22c55e", style: "coupe" },
  },
  {
    to: "/count",
    label: "Count Cars",
    icon: "🔢",
    gradient: "from-emerald-400 to-emerald-600",
    car: { color: "#3b82f6", style: "hyper" },
  },
  {
    to: "/park",
    label: "Parking Lot",
    icon: "🅿️",
    gradient: "from-sky-400 to-sky-600",
    car: { color: "#fb923c", style: "roadster" },
  },
  {
    to: "/more",
    label: "More Cars",
    icon: "⚖️",
    gradient: "from-fuchsia-400 to-fuchsia-600",
    car: { color: "#f472b6", style: "coupe" },
  },
  {
    to: "/traffic",
    label: "Traffic Jam",
    icon: "🚦",
    gradient: "from-teal-400 to-teal-600",
    car: { color: "#a855f7", style: "hyper" },
  },
  {
    to: "/people",
    label: "My People",
    icon: "👨‍👩‍👧",
    gradient: "from-pink-400 to-rose-500",
    car: { color: "#14b8a6", style: "wedge" },
  },
  {
    to: "/police",
    label: "Police Patrol",
    icon: "👮🏾",
    gradient: "from-blue-600 to-red-500",
    car: { color: "#2563eb", style: "coupe" },
  },
  {
    to: "/sailor",
    label: "Sailor Adventure",
    icon: "⚓",
    gradient: "from-cyan-400 to-blue-700",
    car: { color: "#0ea5e9", style: "roadster" },
  },
  {
    to: "/musician",
    label: "Music Maker",
    icon: "🎸",
    gradient: "from-violet-500 to-fuchsia-600",
    car: { color: "#a855f7", style: "wedge" },
  },
  {
    to: "/foodie",
    label: "Foodie Fun",
    icon: "🍔",
    gradient: "from-amber-400 to-orange-600",
    car: { color: "#f97316", style: "coupe" },
  },
  {
    to: "/sleeping",
    label: "Sleepy Time",
    icon: "🌙",
    gradient: "from-indigo-700 to-violet-800",
    car: { color: "#6366f1", style: "hyper" },
  },
  {
    to: "/dinosaur",
    label: "Dinosaur Dig",
    icon: "🦖",
    gradient: "from-emerald-700 to-lime-500",
    car: { color: "#16a34a", style: "hyper" },
  },
  {
    to: "/ghosts",
    label: "Ghost Game",
    icon: "👻",
    gradient: "from-indigo-900 via-violet-800 to-fuchsia-700",
    car: { color: "#a855f7", style: "wedge" },
  },
  {
    to: "/soccer",
    label: "Soccer Stars",
    icon: "⚽",
    gradient: "from-green-500 to-emerald-700",
    car: { color: "#22c55e", style: "coupe" },
  },
  {
    to: "/carshow",
    label: "Car Show Race",
    icon: "🏁",
    gradient: "from-orange-400 to-rose-600",
    car: { color: "#f97316", style: "hyper" },
  },
  {
    to: "/numbers",
    label: "Number Train",
    icon: "🚂",
    gradient: "from-indigo-400 to-violet-600",
    car: { color: "#6366f1", style: "roadster" },
  },
  {
    to: "/patterns",
    label: "Pattern Parade",
    icon: "🎨",
    gradient: "from-fuchsia-400 to-pink-600",
    car: { color: "#ec4899", style: "wedge" },
  },
  {
    to: "/goalspell",
    label: "Goal Spell",
    icon: "🥅",
    gradient: "from-lime-500 to-green-700",
    car: { color: "#84cc16", style: "coupe" },
  },
  {
    to: "/vocab",
    label: "Picture Words",
    icon: "🖼️",
    gradient: "from-emerald-400 to-green-600",
    car: { color: "#22c55e", style: "coupe" },
  },
  {
    to: "/findit",
    label: "Find It on Sonny",
    icon: "🔍",
    gradient: "from-amber-400 to-orange-600",
    car: { color: "#f59e0b", style: "hyper" },
  },
  {
    to: "/safari",
    label: "Sort Safari",
    icon: "🦁",
    gradient: "from-yellow-400 to-orange-500",
    car: { color: "#eab308", style: "wedge" },
  },
  {
    to: "/opposites",
    label: "Opposites",
    icon: "↔️",
    gradient: "from-fuchsia-400 to-purple-600",
    car: { color: "#d946ef", style: "roadster" },
  },
  {
    to: "/rhymes",
    label: "Rhyme Time",
    icon: "🎤",
    gradient: "from-violet-400 to-indigo-600",
    car: { color: "#8b5cf6", style: "coupe" },
  },
  {
    to: "/memory",
    label: "Memory Match",
    icon: "🃏",
    gradient: "from-sky-400 to-indigo-600",
    car: { color: "#38bdf8", style: "hyper" },
  },
  {
    to: "/photomatch",
    label: "Photo Match",
    icon: "📸",
    gradient: "from-cyan-400 to-blue-600",
    car: { color: "#06b6d4", style: "wedge" },
  },
  {
    to: "/rhymematch",
    label: "Rhyme Match",
    icon: "🎵",
    gradient: "from-purple-400 to-pink-600",
    car: { color: "#a855f7", style: "hyper" },
  },
  {
    to: "/balloons",
    label: "Balloon Pop",
    icon: "🎈",
    gradient: "from-rose-400 to-red-600",
    car: { color: "#f43f5e", style: "coupe" },
  },
  {
    to: "/wordtrain",
    label: "Word Train",
    icon: "🚂",
    gradient: "from-orange-400 to-red-600",
    car: { color: "#f97316", style: "roadster" },
  },
  {
    to: "/boat",
    label: "Boat Captain",
    icon: "⛵",
    gradient: "from-sky-400 to-blue-700",
    car: { color: "#0ea5e9", style: "wedge" },
  },
  {
    to: "/plane",
    label: "Sky Pilot",
    icon: "✈️",
    gradient: "from-indigo-400 to-sky-600",
    car: { color: "#6366f1", style: "hyper" },
  },
  {
    to: "/sequence",
    label: "Copy Me",
    icon: "🧠",
    gradient: "from-pink-400 to-rose-600",
    car: { color: "#ec4899", style: "wedge" },
  },
  {
    to: "/missing",
    label: "What's Missing?",
    icon: "🕵️",
    gradient: "from-amber-400 to-yellow-600",
    car: { color: "#f59e0b", style: "roadster" },
  },
  {
    to: "/places",
    label: "Home & Town",
    icon: "🏘️",
    gradient: "from-orange-400 to-red-500",
    car: { color: "#f97316", style: "roadster" },
  },
  {
    to: "/world",
    label: "My World",
    icon: "🌎",
    gradient: "from-sky-400 to-emerald-600",
    car: { color: "#0ea5e9", style: "coupe" },
  },
  {
    to: "/garage",
    label: "My Cars",
    icon: "🏎️",
    gradient: "from-amber-400 to-orange-500",
    car: { color: "#ef4444", style: "roadster" },
  },
];

const FEATURED = ["/ghosts", "/soccer", "/carshow"];
const ORDERED: Tile[] = [
  ...TILES.filter((t) => FEATURED.includes(t.to)),
  ...TILES.filter((t) => !FEATURED.includes(t.to) && t.to !== "/garage"),
  ...TILES.filter((t) => t.to === "/garage"),
];

function Index() {
  const myCar = useMyCar();

  return (
    <div className="sky relative flex min-h-[100dvh] flex-col overflow-hidden">
      <Clouds />

      <header className="relative z-10 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <img
            src="/sonny/sonny-green.webp"
            alt="Sonny John smiling"
            className="h-24 w-20 shrink-0 object-contain drop-shadow-lg sm:h-36 sm:w-28"
          />
          <div className="min-w-0">
            <button
              type="button"
              aria-label="Say hello"
              onClick={() => {
                sfx.unlock();
                void say("hello");
              }}
              className="text-left"
            >
              <h1 className="text-4xl font-extrabold text-sky-900 drop-shadow-sm sm:text-6xl">
                Sonny's Games
              </h1>
            </button>
            <p className="text-xl font-bold text-sky-800/80 sm:text-3xl">
              Let's learn and race! 🏎️
            </p>
            <div className="mt-2">
              <ContinueButton />
            </div>
          </div>
        </div>
        <StarChip />
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-4xl flex-1 grid-cols-2 content-start gap-3 px-3 pb-4 sm:gap-6 sm:px-6">
        {ORDERED.map((t) =>
          t.to === "/soccer" || t.to === "/carshow" ? (
            <Link
              key={t.to}
              to={t.to}
              onClick={() => {
                sfx.unlock();
                if (t.to === "/soccer") sfx.cheer();
                else sfx.engine();
              }}
              className={`relative col-span-2 flex min-h-44 items-end justify-between overflow-hidden rounded-[2rem] bg-gradient-to-b ${t.gradient} p-4 text-white shadow-2xl ring-4 ring-white/80 transition active:scale-95 sm:min-h-60 sm:p-6`}
            >
              {t.to === "/soccer" ? (
                <span
                  className="ball-bounce absolute right-[36%] top-3 text-4xl sm:text-6xl"
                  aria-hidden
                >
                  ⚽
                </span>
              ) : (
                <SportsCar
                  color="#facc15"
                  style="hyper"
                  driving
                  className="absolute right-[28%] top-3 w-28 sm:w-44"
                />
              )}
              <div className="relative z-10 flex flex-col gap-1 self-center">
                <span className="text-4xl drop-shadow sm:text-6xl" aria-hidden>
                  {t.icon}
                </span>
                <span className="text-3xl font-extrabold drop-shadow sm:text-5xl">{t.label}</span>
                <span className="text-lg font-bold text-yellow-100 sm:text-2xl">
                  {t.to === "/soccer" ? "Count, add and score!" : "Count, add and race!"}
                </span>
              </div>
              {t.to === "/soccer" ? (
                <img
                  src="/sonny/friends.webp"
                  alt="Sonny John and his soccer friend"
                  className="relative z-10 h-36 w-auto self-end object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] sm:h-56"
                />
              ) : (
                <img
                  src="/sonny/carshow-cheer.webp"
                  alt="Sonny John"
                  className="relative z-10 h-40 w-auto self-end object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] sm:h-60"
                />
              )}
            </Link>
          ) : t.to === "/ghosts" ? (
            <Link
              key={t.to}
              to={t.to}
              onClick={() => {
                sfx.unlock();
                sfx.boo();
              }}
              className="night relative col-span-2 flex min-h-44 items-center justify-between overflow-hidden rounded-[2rem] p-4 text-white shadow-2xl ring-4 ring-white/80 transition active:scale-95 sm:min-h-60 sm:p-6"
            >
              <span className="twinkle absolute left-[8%] top-[12%] size-1.5 rounded-full bg-white" />
              <span
                className="twinkle absolute left-[44%] top-[18%] size-1 rounded-full bg-white"
                style={{ animationDelay: "1s" }}
              />
              <span
                className="twinkle absolute left-[30%] top-[62%] size-1.5 rounded-full bg-white"
                style={{ animationDelay: "2s" }}
              />
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-end gap-1">
                  <Ghost
                    tint="lilac"
                    variant={1}
                    id="home-a"
                    className="ghost-float w-14 sm:w-20"
                  />
                  <Ghost tint="mint" variant={3} id="home-b" className="ghost-float w-10 sm:w-14" />
                </div>
                <span className="text-3xl font-extrabold drop-shadow sm:text-5xl">Ghost Game</span>
                <span className="text-lg font-bold text-amber-200 sm:text-2xl">
                  Count, add and boo!
                </span>
              </div>
              <img
                src="/ghost/sonny-portrait.webp"
                alt="Sonny John"
                className="relative z-10 h-40 w-auto self-end object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.55)] sm:h-56"
              />
            </Link>
          ) : (
            <Link
              key={t.to}
              to={t.to}
              onClick={() => {
                sfx.unlock();
                sfx.engine();
              }}
              className={`${t.to === "/garage" ? "col-span-2 " : ""}flex flex-col items-center justify-between gap-1 rounded-[2rem] bg-gradient-to-b ${t.gradient} p-3 text-center text-white shadow-2xl ring-4 ring-white/80 transition active:scale-95 sm:p-5`}
            >
              <span className="text-5xl drop-shadow sm:text-7xl" aria-hidden>
                {t.icon}
              </span>
              <SportsCar color={t.car.color} style={t.car.style} className="w-3/4" />
              <span className="text-2xl font-extrabold drop-shadow sm:text-4xl">{t.label}</span>
            </Link>
          ),
        )}
      </main>

      {/* Sonny's chosen car cruises along the road */}
      <div className="relative z-10 h-20 sm:h-28" aria-hidden>
        <div className="road absolute inset-x-0 bottom-0 h-8 sm:h-10" />
        <div className="drive-loop absolute bottom-3 w-28 sm:w-40">
          <SportsCar
            color={myCar.color}
            style={myCar.style}
            stripe={myCar.stripe}
            driving
            className="w-full"
          />
        </div>
      </div>

      <footer className="relative z-10 flex justify-center bg-slate-600 pb-4 pt-1">
        <ParentPanel />
      </footer>
    </div>
  );
}
