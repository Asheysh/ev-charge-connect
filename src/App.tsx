import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AdminPanel, AuthPanel, FilterPanel, PageFrame, PaymentPanel, RecommendationRail, RewardsPanel, StationsDirectory } from "@/components/ev/ControlPanels";
import { EvMap } from "@/components/ev/EvMap";
import { StationPanel } from "@/components/ev/StationPanel";

function HomePage() {
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

function StationsPage() {
  return (
    <PageFrame>
      <FilterPanel />
      <StationsDirectory />
    </PageFrame>
  );
}

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

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black">404</h1>
        <p className="mt-4 text-xl font-semibold">Page not found</p>
        <p className="mt-2 text-sm text-muted-foreground">The route does not exist in this static React app.</p>
        <Link className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" to="/">
          Go home
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/payment" element={<PageFrame><PaymentPanel /></PageFrame>} />
        <Route path="/payments" element={<Navigate to="/payment" replace />} />
        <Route path="/rewards" element={<PageFrame><RewardsPanel /></PageFrame>} />
        <Route path="/admin" element={<PageFrame><AdminPanel /></PageFrame>} />
        <Route path="/login" element={<PageFrame><AuthPanel /></PageFrame>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
