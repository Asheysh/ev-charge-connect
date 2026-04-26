import { lazy, Suspense, useEffect, useState } from "react";
import { MapPin } from "lucide-react";

const EvMapClient = lazy(() => import("./EvMapClient"));

function MapFallback() {
  return (
    <div className="grid min-h-[520px] place-items-center rounded-2xl border border-border bg-card shadow-panel lg:min-h-[720px]">
      <div className="text-center">
        <MapPin className="mx-auto size-8 text-primary" />
        <p className="mt-3 text-sm font-semibold">Loading charging map</p>
      </div>
    </div>
  );
}

export function EvMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <MapFallback />;

  return (
    <Suspense fallback={<MapFallback />}>
      <EvMapClient />
    </Suspense>
  );
}
