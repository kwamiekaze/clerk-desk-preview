import { useEffect, useRef, useState } from "react";
import {
  Paperclip, Send, X, Square, ChevronDown, Cpu, Coins,
  Brain, ListTree, Wrench, FilePlus, Package, Terminal, ShieldCheck, MessageSquare, Receipt,
} from "lucide-react";
import { builderApi, type ChatMessage, type ChatRequest, type ModelRoute, type StreamPart, type BuildState } from "@/lib/mock/builder";
import { MessageReceipt } from "@/components/billing/MessageReceipt";
import { billingApi, type UsageReceipt } from "@/lib/mock/billing";
import { formatCP } from "@/lib/format";

const MODELS: { id: ModelRoute; label: string; hint: string }[] = [
  { id: "automatic",   label: "Automatic",   hint: "Router picks per step" },
  { id: "fast",        label: "Fast",        hint: "Cheapest, light edits" },
  { id: "recommended", label: "Recommended", hint: "Balanced default" },
  { id: "premium",     label: "Premium",     hint: "Hardest reasoning" },
];

export function ClerkChat({
  initialMessages,
  onState,
  pinnedScope,
  onJumpToFile,
}: {
  initialMessages: ChatMessage[];
  onState: (s: BuildState) => void;
  pinnedScope: string[];
  onJumpToFile: (path: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [model, setModel] = useState<ModelRoute>("recommended");
  const [maxPoints, setMaxPoints] = useState(3);
  const [attachments, setAttachments] = useState<ChatRequest["attachments"]>([]);
  const [streaming, setStreaming] = useState(false);
  const [liveParts, setLiveParts] = useState<StreamPart[]>([]);
  const [openReceipt, setOpenReceipt] = useState<UsageReceipt | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const estimate = builderApi.estimate({ model, text, scope: pinnedScope });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, liveParts]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function send() {
    if (!text.trim() || streaming) return;
    const user: ChatMessage = {
      id: "u_" + Math.random().toString(36).slice(2, 7),
      role: "user",
      text: text.trim(),
      at: new Date().toISOString(),
      attachments,
      scope: pinnedScope,
    };
    setMessages((m) => [...m, user]);
    setText("");
    setAttachments([]);
    setStreaming(true);
    setLiveParts([]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    builderApi.streamChat(
      { text: user.text, attachments, scope: pinnedScope, model, maxPoints },
      {
        onPart: (p) => setLiveParts((parts) => [...parts, p]),
        onState,
        onDone: (msg) => {
          setMessages((m) => [...m, msg]);
          setLiveParts([]);
          setStreaming(false);
        },
      },
      ctrl.signal,
    );
    textareaRef.current?.focus();
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
    setLiveParts([]);
    onState("idle");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-mute">Clerk ledger</div>
        <div className="font-mono text-[10px] text-mute">{messages.length} msg</div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m) => (
          <MessageRow
            key={m.id}
            m={m}
            onJumpToFile={onJumpToFile}
            onOpenReceipt={async () => {
              if (m.role !== "clerk" || !m.receipt) return;
              // SERVER CONTRACT: GET /api/billing/receipts/:messageId
              const r = await billingApi.getUsageReceipt(m.id);
              if (r) setOpenReceipt(r);
            }}
          />
        ))}
        {streaming && liveParts.length > 0 && (
          <div className="rounded-lg border border-secondary/40 bg-secondary/5 p-3">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-secondary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" /> streaming
            </div>
            <PartsStream parts={liveParts} onJumpToFile={onJumpToFile} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-surface/40 p-3">
        {pinnedScope.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1 font-mono text-[10px] text-mute">
            <span className="opacity-60">scope:</span>
            {pinnedScope.map((p) => (
              <span key={p} className="rounded border border-border bg-background px-1.5 py-0.5">{p}</span>
            ))}
          </div>
        )}
        {attachments && attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {attachments.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                {a.name}
                <button onClick={() => setAttachments(attachments?.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="rounded-lg border border-border bg-background focus-within:border-primary/60">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
            }}
            rows={3}
            placeholder="Tell the clerk what to build. ⌘↵ to send."
            className="block w-full resize-none bg-transparent px-3 py-2 text-sm placeholder:text-mute/60 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5">
            <div className="flex items-center gap-1">
              <IconBtn icon={Paperclip} label="Attach" onClick={() => setAttachments([...(attachments ?? []), { name: `screenshot-${Date.now() % 1000}.png`, kind: "image" }])} />
              <ModelSelect value={model} onChange={setModel} />
              <BudgetField value={maxPoints} onChange={setMaxPoints} />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 font-mono text-[10px] text-mute sm:flex">
                <Coins className="h-3 w-3 text-primary" /> est {formatCP(estimate.min)}–{formatCP(estimate.max)} CP
              </div>
              {streaming ? (
                <button onClick={stop} className="inline-flex items-center gap-1 rounded-md border border-destructive/60 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                  <Square className="h-3 w-3" /> Stop
                </button>
              ) : (
                <button onClick={send} disabled={!text.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40">
                  <Send className="h-3 w-3" /> Send
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <MessageReceipt
        open={!!openReceipt}
        receipt={openReceipt}
        onClose={() => setOpenReceipt(null)}
      />
    </div>
  );
}

function IconBtn({ icon: Icon, label, onClick }: { icon: typeof Paperclip; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-mute hover:bg-surface hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ModelSelect({ value, onChange }: { value: ModelRoute; onChange: (v: ModelRoute) => void }) {
  const [open, setOpen] = useState(false);
  const current = MODELS.find((m) => m.id === value)!;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] text-mute hover:bg-surface hover:text-foreground">
        <Cpu className="h-3 w-3" /> {current.label} <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-56 rounded-md border border-border bg-popover p-1 shadow-lg">
          {MODELS.map((m) => (
            <button key={m.id} onClick={() => { onChange(m.id); setOpen(false); }} className={`block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-surface ${m.id === value ? "text-primary" : ""}`}>
              <div className="font-medium">{m.label}</div>
              <div className="font-mono text-[10px] text-mute">{m.hint}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] text-mute hover:bg-surface">
      <Coins className="h-3 w-3 text-primary" /> max
      <input
        type="number"
        min={0.1}
        max={50}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Math.max(0.1, Number(e.target.value) || 0.1))}
        className="w-14 bg-transparent text-right text-foreground focus:outline-none"
      />
      CP
    </label>
  );
}

function MessageRow({
  m,
  onJumpToFile,
  onOpenReceipt,
}: {
  m: ChatMessage;
  onJumpToFile: (p: string) => void;
  onOpenReceipt?: () => void;
}) {
  if (m.role === "user") {
    return (
      <div className="ml-6 rounded-lg border border-border bg-background p-3">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-mute">
          <span>you</span>
          <span>{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="text-sm whitespace-pre-wrap">{m.text}</div>
        {m.scope && m.scope.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px] text-mute">
            {m.scope.map((s) => <span key={s} className="rounded border border-border px-1">{s}</span>)}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="mr-6">
      <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> clerk
        <span className="text-mute normal-case tracking-normal">{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      {m.parts && m.parts.length > 0 && <PartsStream parts={m.parts} onJumpToFile={onJumpToFile} />}
      {m.text && <div className="mt-2 text-sm text-foreground/90">{m.text}</div>}
      {m.receipt && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border bg-surface/60 px-2 py-1.5 font-mono text-[10px] text-mute">
          <span className="inline-flex items-center gap-1">
            <Receipt className="h-3 w-3 text-primary" />
            <span className="text-foreground">{formatCP(m.receipt.pointsSpent)} CP</span>
            <span className="opacity-70">· {(m.receipt.ms / 1000).toFixed(1)}s</span>
          </span>
          <button
            onClick={onOpenReceipt}
            className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-mute hover:border-primary/40 hover:text-primary"
          >
            view receipt
          </button>
        </div>
      )}
    </div>
  );
}

function PartsStream({ parts, onJumpToFile }: { parts: StreamPart[]; onJumpToFile: (p: string) => void }) {
  return (
    <div className="space-y-1.5">
      {parts.map((p) => <PartRow key={p.id} p={p} onJumpToFile={onJumpToFile} />)}
    </div>
  );
}

function PartRow({ p, onJumpToFile }: { p: StreamPart; onJumpToFile: (p: string) => void }) {
  const base = "rounded-md border border-border bg-surface/40 px-2.5 py-1.5 font-mono text-[11px]";
  switch (p.type) {
    case "thinking":
      return <div className={`${base} text-mute italic`}><Brain className="mr-1 inline h-3 w-3" />{p.text}</div>;
    case "plan":
      return (
        <div className={base}>
          <div className="mb-1 text-foreground"><ListTree className="mr-1 inline h-3 w-3 text-secondary" />{p.title}</div>
          <ul className="space-y-0.5 pl-4 text-mute">
            {p.steps.map((s, i) => <li key={i}>· {s}</li>)}
          </ul>
        </div>
      );
    case "tool":
      return <div className={base}><Wrench className="mr-1 inline h-3 w-3 text-secondary" />{p.name} <span className="text-mute">— {p.detail ?? p.status}</span></div>;
    case "file":
      return (
        <button onClick={() => onJumpToFile(p.path)} className={`${base} block w-full text-left hover:border-primary/40`}>
          <FilePlus className="mr-1 inline h-3 w-3 text-primary" />
          <span className="text-foreground">{p.op}</span> <span className="text-mute">{p.path}</span>
          <span className="float-right text-mute">+{p.bytes}b</span>
        </button>
      );
    case "install":
      return <div className={base}><Package className="mr-1 inline h-3 w-3 text-secondary" />installed <span className="text-foreground">{p.pkg}</span>@{p.version}</div>;
    case "command":
      return (
        <div className={base}>
          <Terminal className="mr-1 inline h-3 w-3 text-primary" />
          <span className="text-foreground">$ {p.cmd}</span>
          {p.output && <div className="mt-1 pl-4 text-mute">{p.output}</div>}
        </div>
      );
    case "validation":
      return (
        <div className={base}>
          <ShieldCheck className={`mr-1 inline h-3 w-3 ${p.status === "ok" ? "text-status-ok" : p.status === "warn" ? "text-status-warn" : "text-destructive"}`} />
          {p.check} <span className="text-mute">— {p.detail ?? p.status}</span>
        </div>
      );
    case "message":
      return <div className={`${base} text-foreground/90 normal-case`}><MessageSquare className="mr-1 inline h-3 w-3" />{p.text}</div>;
    case "receipt":
      return null;
  }
}
