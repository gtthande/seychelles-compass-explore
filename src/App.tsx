import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import RouteGuard from "@/components/RouteGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import PasswordReset from "./pages/PasswordReset";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Directory from "./pages/Directory";
import NotFound from "./pages/NotFound";
import BusinessPortal from "./pages/BusinessPortal";
import BusinessDashboard from "./pages/BusinessDashboard";
import Products from "./pages/Products";
import Documentation from "./pages/Documentation";
import AdminPanel from "./pages/AdminPanel";
import PaymentTest from "./pages/PaymentTest";
import EmailPreview from "./pages/EmailPreview";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MaintenanceBanner />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<PasswordReset />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/business" element={<RouteGuard requiredRole="business"><BusinessDashboard /></RouteGuard>} />
          <Route path="/products" element={<Products />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/admin" element={<RouteGuard requiredRole="admin"><AdminPanel /></RouteGuard>} />
          <Route path="/admin/settings" element={<RouteGuard requiredRole="admin"><AdminPanel /></RouteGuard>} />
          <Route path="/payments/test" element={<PaymentTest />} />
          <Route path="/dev/email-preview" element={<EmailPreview />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
