import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminPanel, FilterPanel, PaymentPanel, RecommendationRail, RewardsPanel, TopBar } from "@/components/ev/ControlPanels";
import { EvMap } from "@/components/ev/EvMap";
import { StationPanel } from "@/components/ev/StationPanel";
import { subscribeToStationQueue } from "@/services/evApi";
import { useEvStore } from "@/store/evStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EV Charging Station Locator & Slot Booking" },
      {
        name: "description",
        content: "Find EV charging stations, join live queues, check in by QR, pay by UPI, earn rewards, and manage stations.",
      },
      { property: "og:title", content: "EV Charging Station Locator & Slot Booking" },
      { property: "og:description", content: "Smart EV charging assistant for Indian station discovery, queue management, payments, rewards, and admin tools." },
    ],
  }),
  component: Index,
});

function Index() {
  const { loadStations, refreshQueue, selectedStationId, activeTab } = useEvStore();

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  useEffect(() => {
    void refreshQueue(selectedStationId);
    return subscribeToStationQueue(selectedStationId, () => void refreshQueue(selectedStationId));
  }, [refreshQueue, selectedStationId]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="mx-auto grid max-w-[1560px] gap-5 px-4 py-5 lg:px-6">
        <FilterPanel />
        <RecommendationRail />

        {activeTab === "map" || activeTab === "queue" ? (
          <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
            <EvMap />
            <StationPanel />
          </div>
        ) : null}

        {activeTab === "pay" ? <PaymentPanel /> : null}
        {activeTab === "rewards" ? <RewardsPanel /> : null}
        {activeTab === "admin" ? <AdminPanel /> : null}
      </div>
    </main>
  );
}
