import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense } from "react";
import PortalLogin from "./pages/PortalLogin";
import PatientPortal from "./pages/PatientPortal";

const AdminPortal = lazy(() => import("./pages/AdminPortal"));

const App = () => (
  <>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalLogin />} />
        <Route path="/portal" element={<PortalLogin />} />
        <Route path="/portal-fmteam" element={<PortalLogin />} />
        <Route path="/portal/:token" element={<PatientPortal />} />
        <Route path="/admin" element={<Suspense fallback={null}><AdminPortal /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;

