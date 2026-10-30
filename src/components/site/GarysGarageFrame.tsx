const GARYS_GARAGE_ORIGIN = "https://garys-garage.lovable.app";

export function GarysGarageFrame() {
  return (
    <main className="fixed inset-0 z-50 bg-white">
      <iframe
        title="Gary's Garage"
        src={GARYS_GARAGE_ORIGIN}
        className="h-full w-full border-0"
        allow="autoplay *; fullscreen *"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <noscript>
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <p>
            JavaScript is required for Gary&apos;s Garage. You can also visit{" "}
            <a className="underline" href={GARYS_GARAGE_ORIGIN}>
              garys-garage.lovable.app
            </a>
            .
          </p>
        </div>
      </noscript>
    </main>
  );
}
