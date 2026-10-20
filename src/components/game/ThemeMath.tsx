import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import { COLORS, type CarStyle, type GarageCar } from "@/lib/content";
import {
  ghostKey,
  ghostOptions,
  ghostTier,
  makeGhost,
  TIER_NAMES,
  type GhostQuestion,
} from "@/lib/ghosts";
import { addStars, getProgress, recordAnswer, useProgress } from "@/lib/progress";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { PitchScene, TrackScene } from "./Scenes";
import { SportsCar } from "./SportsCar";
import { Ball, CountBadge, Player } from "./ThemeItems";
import { useAlive } from "./useAlive";

export type ThemeId = "soccer" | "carshow";
type Subject = "ball" | "player" | "car";
type Item = { id: number; group: 0 | 1; leaving: boolean };

const ROUND_LEN = 5;
const numKey = (n: number) => `n_${n}`;
const STYLES: CarStyle[] = ["coupe", "wedge", "roadster", "hyper"];

type Keys = {
  hello: string[];
  count: (s: Subject) => string;
  add: string;
  sub: string;
  more: string;
  moreYes: string;
  noun: (s: Subject, n: number) => string;
  all: string;
  left: (n: number) => string;
  cheer: string;
  win: string;
};

const SOCCER: Keys = {
  hello: ["sc_hello"],
  count: (s) => (s === "player" ? "sc_qp" : "sc_q"),
  add: "sc_add",
  sub: "sc_sub",
  more: "sc_more",
  moreYes: "sc_more_yes",
  noun: (s, n) =>
    s === "player" ? (n === 1 ? "sc_pl1" : "sc_pl") : n === 1 ? "sc_ball1" : "sc_ball",
  all: "sc_all",
  left: (n) => (n === 1 ? "sc_left1" : "sc_left"),
  cheer: "sc_goal",
  win: "sc_goal",
};
const CARSHOW: Keys = {
  hello: ["cs_hello", "cs_go"],
  count: () => "cs_q",
  add: "cs_add",
  sub: "cs_sub",
  more: "more_q",
  moreYes: "more_yes",
  noun: (_s, n) => (n === 1 ? "cs_car1" : "cs_car"),
  all: "cs_all",
  left: (n) => (n === 1 ? "cs_left1" : "cs_left"),
  cheer: "cs_go",
  win: "cs_win",
};

function buildItems(q: GhostQuestion): Item[] {
  const mk = (count: number, group: 0 | 1, start: number): Item[] =>
    Array.from({ length: count }, (_, i) => ({ id: start + i, group, leaving: false }));
  switch (q.kind) {
    case "count":
      return mk(q.n, 0, 0);
    case "add":
      return [...mk(q.a, 0, 0), ...mk(q.b, 1, 20)];
    case "sub":
      return mk(q.total, 0, 0).map((g, i) => ({ ...g, leaving: i >= q.total - q.gone }));
    case "more":
      return [...mk(q.left, 0, 0), ...mk(q.right, 1, 20)];
  }
}

/** Soccer and the car show share one engine: count, add, take away and compare (ages 3 to 5). */
export function ThemeMath({ theme }: { theme: ThemeId }) {
  return theme === "soccer" ? (
    <GameShell title="Soccer Stars" emoji="⚽" bg="pitch" decor={<PitchScene />}>
      <Play theme="soccer" />
    </GameShell>
  ) : (
    <GameShell title="Car Show Race" emoji="🏁" bg="track" decor={<TrackScene />}>
      <Play theme="carshow" />
    </GameShell>
  );
}

function AnswerBtn({
  n,
  theme,
  onClick,
  wrong,
  right,
  hint,
}: {
  n: number;
  theme: ThemeId;
  onClick: () => void;
  wrong: boolean;
  right: boolean;
  hint: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`${n}`}
      onClick={onClick}
      disabled={wrong}
      className={cn(
        "btn-ball relative grid aspect-square w-full place-items-center transition active:scale-90",
        wrong && "shake scale-90 opacity-40",
        right && "happy-jump",
        hint && "hint rounded-full",
      )}
    >
      {theme === "soccer" ? (
        <>
          <Ball className="absolute inset-0" />
          <span className="relative grid size-[52%] place-items-center rounded-full bg-white/95 text-[clamp(2rem,9vw,3.6rem)] font-extrabold leading-none text-slate-900 shadow">
            {n}
          </span>
        </>
      ) : (
        <>
          <span className="absolute inset-0 rounded-full bg-slate-900 ring-4 ring-slate-500" />
          <span className="absolute inset-[18%] rounded-full bg-slate-300 ring-4 ring-slate-400" />
          <span className="relative text-[clamp(2.2rem,10vw,4rem)] font-extrabold leading-none text-slate-900">
            {n}
          </span>
        </>
      )}
    </button>
  );
}

function Mascots({ theme, cheer }: { theme: ThemeId; cheer: boolean }) {
  if (theme === "soccer")
    return (
      <div className="flex shrink-0 items-end" aria-label="Sonny John and his soccer friend">
        <img
          src="/sonny/friends.webp"
          alt="Sonny John and his soccer friend"
          draggable={false}
          className={cn(
            "w-28 object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)] sm:w-48",
            cheer ? "kid-cheer" : "kid-idle",
          )}
        />
      </div>
    );
  return (
    <img
      key={cheer ? "win" : "idle"}
      src={cheer ? "/sonny/carshow-finish.webp" : "/sonny/carshow-cheer.webp"}
      alt="Sonny John"
      draggable={false}
      className={cn(
        "w-24 shrink-0 object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.4)] sm:w-40",
        cheer ? "kid-cheer" : "kid-idle",
      )}
    />
  );
}

function Play({ theme }: { theme: ThemeId }) {
  const K = theme === "soccer" ? SOCCER : CARSHOW;
  const bucket = theme;
  const alive = useAlive();
  const progress = useProgress();
  const firstTry = useRef(0);
  const lastKey = useRef<string | undefined>(undefined);
  const greeted = useRef(false);

  const makeQ = (): { q: GhostQuestion; subject: Subject } => {
    const p = getProgress();
    const q = makeGhost(ghostTier(p[bucket]), p[bucket], lastKey.current);
    lastKey.current = ghostKey(q);
    const subject: Subject =
      theme === "carshow" ? "car" : q.kind === "count" && Math.random() < 0.4 ? "player" : "ball";
    return { q, subject };
  };

  const [qIndex, setQIndex] = useState(0);
  const [cur, setCur] = useState(() => makeQ());
  const { q, subject } = cur;
  const items = useMemo(() => buildItems(q), [q]);
  const options = useMemo(() => (q.kind === "more" ? [] : ghostOptions(q.n)), [q]);

  const [counted, setCounted] = useState<number[]>([]);
  const [gone, setGone] = useState(false);
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [auto, setAuto] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongNums, setWrongNums] = useState<number[]>([]);
  const [wrongSide, setWrongSide] = useState<"left" | "right" | null>(null);
  const [cheer, setCheer] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  const tier = ghostTier(progress[bucket]);
  const stay = (g: Item) => !(q.kind === "sub" && g.leaving);
  const countable = items.filter(stay);
  const promptKey = {
    count: K.count(subject),
    add: K.add,
    sub: K.sub,
    more: K.more,
  }[q.kind];

  useEffect(() => {
    preloadClips(voiceGroup(theme));
  }, [theme]);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const lines = greeted.current ? [promptKey] : [...K.hello, promptKey];
      greeted.current = true;
      void say(...lines);
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, done]);

  useEffect(() => {
    if (q.kind !== "sub") return;
    const t = window.setTimeout(() => {
      setGone(true);
      sfx.whoosh();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [q]);

  const tick = (k: number) => (theme === "soccer" ? sfx.ghost(k) : sfx.honk());

  function tapItem(g: Item) {
    if (status !== "ask" || auto || q.kind === "more" || !stay(g)) return;
    const at = counted.indexOf(g.id);
    if (at >= 0) {
      tick(at + 1);
      void say(numKey(at + 1));
      return;
    }
    const next = [...counted, g.id];
    setCounted(next);
    tick(next.length);
    void say(numKey(next.length));
  }

  async function autoCount() {
    setAuto(true);
    setCounted([]);
    for (let k = 0; k < countable.length; k++) {
      await sleep(250);
      if (!alive.current) return;
      setCounted(countable.slice(0, k + 1).map((g) => g.id));
      tick(k + 1);
      await say(numKey(k + 1));
      if (!alive.current) return;
    }
    await sleep(300);
    if (!alive.current) return;
    setAuto(false);
    void say(promptKey);
  }

  async function celebrate(lines: string[]) {
    setStatus("correct");
    sfx.correct();
    setCounted(countable.map((g) => g.id));
    if (q.kind === "add") setJoined(true);
    setCheer(true);
    if (theme === "soccer") sfx.cheer();
    else sfx.engine();
    await say(...lines);
    await sleep(450);
    if (!alive.current) return;
    setCheer(false);
    await sleep(350);
  }

  async function finishRound() {
    const before = getProgress().stars;
    const earned = starsForRound(firstTry.current, ROUND_LEN);
    setCheer(true);
    sfx.cheer();
    await say(K.win);
    if (!alive.current) return;
    addStars(earned);
    setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
  }

  function reset(next: { q: GhostQuestion; subject: Subject }) {
    setCur(next);
    setCounted([]);
    setGone(false);
    setJoined(false);
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
    setWrongSide(null);
    setCheer(false);
  }

  async function advance() {
    if (qIndex + 1 >= ROUND_LEN) return finishRound();
    setQIndex(qIndex + 1);
    reset(makeQ());
  }

  function scored(correct: boolean) {
    if (wrongCount === 0) {
      if (correct) firstTry.current += 1;
      recordAnswer(bucket, ghostKey(q), correct);
    }
  }

  async function answer(num: number) {
    if (status !== "ask" || auto || wrongNums.includes(num) || q.kind === "more") return;
    if (q.kind === "sub" && !gone) return;
    if (num !== q.n) {
      scored(false);
      setWrongCount((c) => c + 1);
      setWrongNums((w) => [...w, num]);
      sfx.wrong();
      await say(`no_n_${num}`, "lets_count");
      if (alive.current) await autoCount();
      return;
    }
    scored(true);
    const tail = q.kind === "add" ? K.all : q.kind === "sub" ? K.left(q.n) : K.noun(subject, q.n);
    await celebrate(["yes", numKey(q.n), tail]);
    if (alive.current) await advance();
  }

  async function pickSide(side: "left" | "right") {
    if (status !== "ask" || q.kind !== "more" || wrongSide === side) return;
    if (side !== q.answer) {
      scored(false);
      setWrongCount((c) => c + 1);
      setWrongSide(side);
      sfx.wrong();
      void say("try_again", K.more);
      return;
    }
    scored(true);
    await celebrate([sample(CHEER_KEYS), K.moreYes]);
    if (alive.current) await advance();
  }

  function restart() {
    firstTry.current = 0;
    lastKey.current = undefined;
    setDone(null);
    setQIndex(0);
    reset(makeQ());
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        hero={
          theme === "soccer" ? (
            <div className="pop flex items-end rounded-[2rem] bg-white/30 px-4 pt-3 shadow-xl ring-4 ring-white/70">
              <img
                src="/sonny/friends.webp"
                alt="Sonny John and his soccer friend"
                className="kid-cheer h-48 object-contain sm:h-72"
              />
            </div>
          ) : (
            <img
              src="/sonny/carshow-finish.webp"
              alt="Sonny John"
              className="pop kid-cheer h-56 object-contain drop-shadow-xl sm:h-80"
            />
          )
        }
        onAgain={restart}
      />
    );

  const headline = {
    count:
      subject === "player"
        ? "How many players?"
        : subject === "car"
          ? "How many cars?"
          : "How many balls?",
    add: q.kind === "add" ? `${q.a} + ${q.b} = ?` : "",
    sub: q.kind === "sub" ? `${q.total} − ${q.gone} = ?` : "",
    more: theme === "soccer" ? "Which team has more?" : "Which side has more?",
  }[q.kind];

  const groupItems = (group: 0 | 1) => items.filter((g) => g.group === group);

  const renderItem = (g: Item, size: string): ReactNode => {
    const at = counted.indexOf(g.id);
    const away = q.kind === "sub" && g.leaving && gone;
    const inner =
      subject === "car" ? (
        <SportsCar
          color={COLORS[g.id % COLORS.length]?.hex}
          style={STYLES[g.id % STYLES.length]}
          className="w-full"
          driving={away}
        />
      ) : subject === "player" ? (
        <div className="aspect-[2/3] w-full">
          <Player team={g.id % 2 ? "gold" : "blue"} n={g.id + 1} seed={g.id} />
        </div>
      ) : (
        <div className="aspect-square w-full">
          <Ball />
        </div>
      );
    return (
      <button
        key={g.id}
        type="button"
        aria-label={subject}
        onClick={() => tapItem(g)}
        className={cn("relative transition active:scale-90", size, away && "pointer-events-none")}
      >
        <div
          className={cn(
            !away && subject === "ball" && "ball-bounce",
            !away && subject !== "ball" && "kid-idle",
            away && (subject === "car" ? "drive-away" : "roll-away"),
            at >= 0 && "scale-110",
          )}
          style={{ animationDelay: `${(g.id % 6) * 0.3}s` }}
        >
          <div className={cn(at >= 0 && "drop-shadow-[0_0_14px_rgba(251,191,36,0.95)]")}>
            {inner}
          </div>
        </div>
        {at >= 0 && <CountBadge n={at + 1} />}
      </button>
    );
  };

  const sizeFor = (n: number) =>
    subject === "car"
      ? n <= 1
        ? "w-[70%] max-w-[18rem] sm:max-w-[22rem]"
        : n <= 3
          ? "w-[31%] max-w-[11rem] sm:max-w-[14rem]"
          : n <= 4
            ? "w-[46%] max-w-[13rem] sm:max-w-[16rem]"
            : n <= 6
              ? "w-[31%] max-w-[10rem] sm:max-w-[13rem]"
              : "w-[23%] max-w-[8rem] sm:max-w-[10rem]"
      : subject === "player"
        ? n <= 3
          ? "w-[22%] max-w-[7rem] sm:max-w-[9rem]"
          : n <= 6
            ? "w-[17%] max-w-[5.5rem] sm:max-w-[7.5rem]"
            : "w-[14%] max-w-[4.5rem] sm:max-w-[6rem]"
        : n <= 1
          ? "w-[34%] max-w-[10rem] sm:max-w-[13rem]"
          : n <= 3
            ? "w-[24%] max-w-[7.5rem] sm:max-w-[10rem]"
            : n <= 6
              ? "w-[19%] max-w-[6rem] sm:max-w-[8rem]"
              : "w-[15%] max-w-[5rem] sm:max-w-[6.5rem]";

  const pct = ((qIndex + (status === "correct" ? 1 : 0)) / ROUND_LEN) * 100;

  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-3 pb-3 sm:gap-4 sm:px-8">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(promptKey)}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 ring-sky-300 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2
          key={qIndex}
          className="pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-3xl font-extrabold tracking-wide text-sky-950 shadow-xl ring-4 ring-sky-300 sm:text-6xl"
        >
          {headline}
        </h2>
      </div>

      {/* progress */}
      <div
        className="flex w-full max-w-md items-center gap-2"
        aria-label={`Question ${qIndex + 1} of ${ROUND_LEN}`}
      >
        {theme === "carshow" ? (
          <div className="relative h-9 flex-1 rounded-full bg-slate-700/90 ring-2 ring-white/70 sm:h-12">
            <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-white/60" />
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl">
              🏁
            </span>
            <div
              className="absolute top-1/2 w-10 -translate-y-1/2 transition-all duration-700 sm:w-14"
              style={{ left: `calc(${pct * 0.82}% )` }}
            >
              <SportsCar
                color="#ef4444"
                style="coupe"
                driving={status === "correct"}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 justify-center gap-1.5">
            {Array.from({ length: ROUND_LEN }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "grid size-8 place-items-center rounded-full text-lg transition sm:size-10",
                  i < qIndex || (i === qIndex && status === "correct")
                    ? "bg-white shadow-lg"
                    : "bg-white/30 ring-1 ring-white/60",
                )}
              >
                {i < qIndex || (i === qIndex && status === "correct") ? "⚽" : ""}
              </span>
            ))}
          </div>
        )}
        <span className="hidden text-sm font-bold text-sky-950/70 sm:block">
          {TIER_NAMES[tier]}
        </span>
      </div>

      {/* playfield */}
      <div
        key={qIndex}
        className="pop relative flex w-full max-w-4xl flex-1 items-center justify-center overflow-hidden rounded-[2rem] bg-white/20 p-2 shadow-inner ring-2 ring-white/50 backdrop-blur-[2px] sm:p-6"
      >
        {q.kind === "more" ? (
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-6">
            {(["left", "right"] as const).map((side) => {
              const wrong = wrongSide === side;
              const hint = wrongCount >= 2 && side === q.answer && status === "ask";
              const blue = side === "left";
              return (
                <button
                  key={side}
                  type="button"
                  aria-label={`${side} side`}
                  onClick={() => void pickSide(side)}
                  className={cn(
                    "flex flex-wrap content-center items-end justify-center gap-1 rounded-[1.75rem] p-2 ring-4 transition active:scale-95",
                    theme === "soccer"
                      ? blue
                        ? "bg-blue-500/30 ring-blue-300"
                        : "bg-amber-400/30 ring-amber-200"
                      : "bg-white/20 ring-white/60",
                    wrong && "shake opacity-50",
                    hint && "hint",
                    status === "correct" && side === q.answer && "ring-yellow-300",
                  )}
                >
                  {groupItems(side === "left" ? 0 : 1).map((g) => (
                    <div
                      key={g.id}
                      className={subject === "car" ? "w-[46%]" : "w-[28%] sm:w-[22%]"}
                    >
                      {subject === "car" ? (
                        <SportsCar
                          color={COLORS[(g.id + (blue ? 0 : 3)) % COLORS.length]?.hex}
                          style={STYLES[g.id % STYLES.length]}
                          className="w-full"
                        />
                      ) : (
                        <div className="aspect-square">
                          <Ball />
                        </div>
                      )}
                    </div>
                  ))}
                </button>
              );
            })}
          </div>
        ) : q.kind === "add" ? (
          <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <div className="flex flex-wrap justify-center gap-1">
              {groupItems(0).map((g) => renderItem(g, sizeFor(Math.max(q.a, q.b) + 2)))}
            </div>
            <span className="text-5xl font-extrabold text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.3)] sm:text-7xl">
              {joined ? "=" : "+"}
            </span>
            <div className={cn("flex flex-wrap justify-center gap-1", joined && "ghost-join")}>
              {groupItems(1).map((g) => renderItem(g, sizeFor(Math.max(q.a, q.b) + 2)))}
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-wrap content-center items-center justify-center gap-x-1 gap-y-3 sm:gap-x-3">
            {items.map((g) => renderItem(g, sizeFor(q.kind === "sub" ? q.total : q.n)))}
          </div>
        )}
      </div>

      {/* mascots + answers */}
      <div className="flex w-full max-w-4xl items-end gap-2 sm:gap-6">
        <Mascots theme={theme} cheer={cheer} />
        {q.kind === "more" ? (
          <p className="flex-1 pb-4 text-center text-xl font-extrabold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] sm:text-3xl">
            {theme === "soccer" ? "Tap the team with more balls!" : "Tap the side with more cars!"}
          </p>
        ) : (
          <div className="grid flex-1 grid-cols-3 gap-1 sm:gap-5">
            {options.map((n) => (
              <AnswerBtn
                key={n}
                n={n}
                theme={theme}
                wrong={wrongNums.includes(n)}
                right={status === "correct" && n === q.n}
                hint={wrongCount >= 2 && n === q.n && status === "ask"}
                onClick={() => void answer(n)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

