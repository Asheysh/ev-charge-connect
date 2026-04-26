import { createFileRoute } from "@tanstack/react-router";
import { FilterPanel, PageFrame, StationsDirectory } from "@/components/ev/ControlPanels";

export const Route = createFileRoute("/stations")({
  head: () => ({
    meta: [
      { title: "EV Station Directory" },
      { name: "description", content: "Browse EV charging stations by city, connector type, availability, power, and price." },
      { property: "og:title", content: "EV Station Directory" },
      { property: "og:description", content: "Compare EV charging station slots, connectors, pricing, and reliability." },
    ],
  }),
  component: StationsPage,
});

function StationsPage() {
  return (
    <PageFrame>
      <FilterPanel />
      <StationsDirectory />
    </PageFrame>
  );
}
