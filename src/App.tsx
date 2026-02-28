import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import PortalLogin from "./pages/PortalLogin";
import PatientPortal from "./pages/PatientPortal";

const App = () => (
  <>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalLogin />} />
        <Route path="/portal" element={<PortalLogin />} />
        <Route path="/portal-fmteam" element={<PortalLogin />} />
        <Route path="/portal/:token" element={<PatientPortal />} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;

