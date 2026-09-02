import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { LandingPage } from "./pages/LandingPage";
import { RoleSelectionPage } from "./pages/RoleSelectionPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminShipments } from "./pages/admin/AdminShipments";
import { AdminClusters } from "./pages/admin/AdminClusters";
import { AdminRoutes } from "./pages/admin/AdminRoutes";
import { AdminIncidents } from "./pages/admin/AdminIncidents";
import { AdminMap } from "./pages/admin/AdminMap";

import { BusinessDashboard } from "./pages/BusinessDashboard";
import { AgentDashboard } from "./pages/AgentDashboard";
import { ShipmentDetailsPage } from "./pages/ShipmentDetailsPage";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/select-role" element={<RoleSelectionPage />} />
            <Route path="/login/:role" element={<LoginPage />} />
            <Route
              path="/login"
              element={<Navigate to="/select-role" replace />}
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/:role" element={<RegisterPage />} />

            {/* ================= ADMIN ================= */}
            <Route path="/admin" element={<AdminLayout />}>
              {/* /admin */}
              <Route index element={<AdminDashboard />} />

              {/* /admin/shipments */}
              <Route path="shipments" element={<AdminShipments />} />
              <Route path="shipments/:id" element={<ShipmentDetailsPage />} />

              {/* /admin/clusters */}
              <Route path="clusters" element={<AdminClusters />} />

              {/* /admin/routes */}
              <Route path="routes" element={<AdminRoutes />} />

              {/* /admin/incidents */}
              <Route path="incidents" element={<AdminIncidents />} />

              {/* /admin/map */}
              <Route path="map" element={<AdminMap />} />
            </Route>

            {/* Other roles */}
            <Route path="/business" element={<BusinessDashboard />} />
            <Route path="/business/shipments/:id" element={<ShipmentDetailsPage />} />
            <Route path="/agent" element={<AgentDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}