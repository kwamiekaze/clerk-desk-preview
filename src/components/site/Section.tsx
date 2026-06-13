import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
  align?: "left" | "center";
};

export function Section({
  id,
  eyebrow,
  title,
  description,
  className = "",
  children,
  align = "left",
}: Props) {
  return (
    <section id={id} className={`relative border-t border-border py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
          {eyebrow && (
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </div>
          )}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-base text-mute sm:text-lg">{description}</p>
          )}
        </header>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
