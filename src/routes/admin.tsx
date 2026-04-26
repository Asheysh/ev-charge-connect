import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel, PageFrame } from "@/components/ev/ControlPanels";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "EV Charging Admin Dashboard" },
      { name: "description", content: "Monitor station slots, revenue, charger health, reliability scores, and operator metrics." },
      { property: "og:title", content: "EV Charging Admin Dashboard" },
      { property: "og:description", content: "EV charging operator dashboard for station and queue management." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return <PageFrame><AdminPanel /></PageFrame>;
}
