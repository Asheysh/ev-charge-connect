import { lazy, Suspense, useEffect, useState } from "react";
import { MapPin } from "lucide-react";

const EvMapClient = lazy(() => import("./EvMapClient"));

function MapFallback() {
  return (
    <div className="glass-panel premium-border grid min-h-[520px] place-items-center rounded-3xl border shadow-panel lg:min-h-[720px]">
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
