const WARREN_CO_ORIGIN = "https://tailored-brand-launchpad.lovable.app";

export function WarrenCoFrame() {
  return (
    <main className="fixed inset-0 z-50 bg-[#2a0d0d]">
      <iframe
        title="Warren Co. Commercial & Residential Cleaning"
        src={WARREN_CO_ORIGIN}
        className="h-full w-full border-0"
        allow="autoplay *; fullscreen *"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <noscript>
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <p>
            JavaScript is required for the Warren Co. showroom. Call{" "}
            <a className="underline" href="tel:+14046551395">
              404-655-1395
            </a>
            .
          </p>
        </div>
      </noscript>
    </main>
  );
}
