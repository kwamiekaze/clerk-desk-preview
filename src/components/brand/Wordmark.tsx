type WordmarkProps = {
  className?: string;
  showSymbol?: boolean;
};

/**
 * CodingClerks wordmark — editorial sans, monospaced bracket affix.
 */
export function Wordmark({ className = "", showSymbol = true }: WordmarkProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {showSymbol && <CommandSymbol />}
      <span className="text-[15px] font-semibold tracking-tight text-foreground leading-none">
        Coding<span className="text-primary">Clerks</span>
      </span>
    </div>
  );
}

/**
 * Compact command-style symbol: terminal bracket with a caret and a tick.
 */
export function CommandSymbol({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-strong bg-surface ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
        <path
          d="M5 7l4 5-4 5"
          className="text-primary"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path
          d="M12 17h7"
          className="text-foreground"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
      <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-cc-pulse-dot" />
    </span>
  );
}
