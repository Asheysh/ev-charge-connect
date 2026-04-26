import { createFileRoute } from "@tanstack/react-router";
import { PageFrame, PaymentPanel } from "@/components/ev/ControlPanels";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "EV Charging Payments" },
      { name: "description", content: "Simulate UPI payment, charging cost estimates, and payment history for EV sessions." },
      { property: "og:title", content: "EV Charging Payments" },
      { property: "og:description", content: "UPI-ready EV charging payment and transaction ledger experience." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  return <PageFrame><PaymentPanel /></PageFrame>;
}
