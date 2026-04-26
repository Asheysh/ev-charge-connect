import { createFileRoute } from "@tanstack/react-router";
import { PageFrame, RecommendationRail } from "@/components/ev/ControlPanels";
import { StationPanel } from "@/components/ev/StationPanel";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "EV Slot Booking & Live Queue" },
      { name: "description", content: "Join charging queues, check in by QR, start charging, and track ETA for selected EV stations." },
      { property: "og:title", content: "EV Slot Booking & Live Queue" },
      { property: "og:description", content: "Book EV charging slots with realtime queue and QR check-in flows." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  return (
    <PageFrame>
      <RecommendationRail />
      <div className="mx-auto w-full max-w-3xl">
        <StationPanel />
      </div>
    </PageFrame>
  );
}
