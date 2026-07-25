import { useEffect, useState } from "react";

// Autoplay-safe, reduced-motion-aware background video with a
// gradient/poster fallback. Renders `fallback` when reduced motion is on
// or when the video errors.
export function BackgroundVideo({
  src,
  className = "",
  overlayClassName = "",
  fallback,
  opacity = 1,
}: {
  src: string;
  className?: string;
  overlayClassName?: string;
  fallback: React.ReactNode;
  opacity?: number;
}) {
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  if (!src || reduced || failed) {
    return <>{fallback}</>;
  }

  return (
    <>
      <video
        key={src}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
        className={`pointer-events-none object-cover ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      />
      {overlayClassName && <div aria-hidden className={`pointer-events-none ${overlayClassName}`} />}
    </>
  );
}
