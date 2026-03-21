import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth, RedirectIfAuth } from "@/components/guards/RouteGuards";

import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import CustomerPortal from "@/pages/CustomerPortal";

import DashboardLayout from "@/components/DashboardLayout";
import InboxPage from "@/pages/dashboard/InboxPage";
import CustomersPage from "@/pages/dashboard/CustomersPage";
import SocialComplaintsPage from "@/pages/dashboard/SocialComplaintsPage";
import AnalyticsPage from "@/pages/dashboard/AnalyticsPage";
import CampaignsPage from "@/pages/dashboard/CampaignsPage";
import CompliancePage from "@/pages/dashboard/CompliancePage";
import AIControlPage from "@/pages/dashboard/AIControlPage";
import WorkflowPage from "@/pages/dashboard/WorkflowPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Redirect logged-in users away from /login */}
              <Route element={<RedirectIfAuth />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Employer-only: /dashboard */}
              <Route element={<RequireAuth allowedRoles={["employer"]} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<InboxPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="complaints" element={<SocialComplaintsPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="campaigns" element={<CampaignsPage />} />
                  <Route path="compliance" element={<CompliancePage />} />
                  <Route path="ai-control" element={<AIControlPage />} />
                  <Route path="workflow" element={<WorkflowPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Customer-only: /portal */}
              <Route element={<RequireAuth allowedRoles={["customer"]} />}>
                <Route path="/portal" element={<CustomerPortal />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
