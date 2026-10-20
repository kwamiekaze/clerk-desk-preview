const SONNY_GAMES_ORIGIN = "https://sonnygames.lovable.app";

export function SonnyGamesFrame() {
  return (
    <main className="fixed inset-0 z-50 bg-sky-100">
      <iframe
        title="Sonny's Games"
        src={SONNY_GAMES_ORIGIN}
        className="h-full w-full border-0"
        // Explicitly delegate playback to the cross-origin game so Web Audio can leave its
        // browser-imposed suspended state after the player's first tap.
        allow="autoplay *; fullscreen *"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <noscript>
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <p>
            JavaScript is required for Sonny&apos;s Games. You can also play at{" "}
            <a className="underline" href={SONNY_GAMES_ORIGIN}>
              sonnygames.lovable.app
            </a>
            .
          </p>
        </div>
      </noscript>
    </main>
  );
}
