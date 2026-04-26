import { createFileRoute } from "@tanstack/react-router";
import { PageFrame, RewardsPanel } from "@/components/ev/ControlPanels";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "EV Charging Rewards" },
      { name: "description", content: "Track EV charging reward coins, verification incentives, discounts, and queue benefits." },
      { property: "og:title", content: "EV Charging Rewards" },
      { property: "og:description", content: "Earn and redeem reward coins for EV charging activity." },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  return <PageFrame><RewardsPanel /></PageFrame>;
}
