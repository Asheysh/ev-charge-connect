import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel, PageFrame } from "@/components/ev/ControlPanels";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "EV Driver Login" },
      { name: "description", content: "Login or create an EV driver profile with external Supabase Auth." },
      { property: "og:title", content: "EV Driver Login" },
      { property: "og:description", content: "Secure EV charging account login and driver profile setup." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return <PageFrame><AuthPanel /></PageFrame>;
}
