import { createFileRoute } from "@tanstack/react-router";
import { EvMap } from "@/components/ev/EvMap";
import { FilterPanel, PageFrame, RecommendationRail } from "@/components/ev/ControlPanels";
import { StationPanel } from "@/components/ev/StationPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EV Charging Station Locator & Slot Booking" },
      { name: "description", content: "Find EV charging stations, join live queues, pay by UPI, and manage charging rewards across India." },
      { property: "og:title", content: "EV Charging Station Locator & Slot Booking" },
      { property: "og:description", content: "Smart EV charging assistant for station discovery, realtime queues, payments, rewards, and admin tools." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageFrame>
      <FilterPanel />
      <RecommendationRail />
      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <EvMap />
        <StationPanel />
      </div>
    </PageFrame>
  );
}
