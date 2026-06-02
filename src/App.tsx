import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PortalLogin from "./pages/PortalLogin";
import PatientPortal from "./pages/PatientPortal";

const AdminPortal = lazy(() => import("./pages/AdminPortal"));

const App = () => (
  <ErrorBoundary>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalLogin />} />
        <Route path="/portal" element={<PortalLogin />} />
        <Route path="/portal-fmteam" element={<PortalLogin />} />
        <Route path="/portal/:token" element={<PatientPortal />} />
        <Route path="/admin" element={<Suspense fallback={null}><AdminPortal /></Suspense>} />
        {/* Rota curinga para portais de outros trainers: /portal-evaner, /portal-nutri-matheus, etc. */}
        <Route path="*" element={<PortalLogin />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;

