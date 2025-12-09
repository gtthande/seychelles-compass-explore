import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import RouteGuard from "@/components/RouteGuard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

// Lazy load heavy pages and admin components
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Directory = lazy(() => import("./pages/Directory"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const Products = lazy(() => import("./pages/Products"));
const Documentation = lazy(() => import("./pages/Documentation"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const BusinessEdit = lazy(() => import("./pages/admin/BusinessEdit"));
const BusinessCreate = lazy(() => import("./pages/admin/BusinessCreate"));
const ProductEdit = lazy(() => import("./pages/admin/ProductEdit"));
const ProductCreate = lazy(() => import("./pages/admin/ProductCreate"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const BusinessRegister = lazy(() => import("./pages/BusinessRegister"));
const PaymentTest = lazy(() => import("./pages/PaymentTest"));
const EmailPreview = lazy(() => import("./pages/EmailPreview"));
const PendingBusinesses = lazy(() => import("./pages/admin/PendingBusinesses"));
const Search = lazy(() => import("./pages/Search"));
const MyProductsPage = lazy(() => import("./pages/dashboard/my-products"));

const queryClient = new QueryClient();

const App = () => {
  // Add global error handlers
  window.addEventListener('error', (event) => {
    console.error('🚨 Global JavaScript Error:', event.error);
    console.error('📍 Error details:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    console.error('📍 Promise rejection details:', event.reason);
  });

  return (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MaintenanceBanner />
          <Toaster />
          <Sonner />
          <HotToaster position="bottom-right" />
          <BrowserRouter>
            <Suspense fallback={<LoadingSkeleton />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/reset-password" element={<PasswordReset />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/search" element={<Search />} />
                <Route path="/business/:id" element={<BusinessDetail />} />
                <Route path="/business" element={<RouteGuard><BusinessDashboard /></RouteGuard>} />
                <Route path="/business/products" element={<RouteGuard><MyProductsPage /></RouteGuard>} />
                <Route path="/business/register" element={<BusinessRegister />} />
                <Route path="/products" element={<Products />} />
                <Route path="/docs" element={<Documentation />} />
                <Route path="/admin" element={<RouteGuard><AdminPanel /></RouteGuard>} />
                <Route path="/admin/settings" element={<RouteGuard><AdminPanel /></RouteGuard>} />
                <Route path="/admin/businesses/create" element={<RouteGuard><BusinessCreate /></RouteGuard>} />
                <Route path="/admin/businesses/edit/:id" element={<RouteGuard><BusinessEdit /></RouteGuard>} />
                <Route path="/admin/businesses/pending" element={<RouteGuard><PendingBusinesses /></RouteGuard>} />
                <Route path="/admin/products/create" element={<RouteGuard><ProductCreate /></RouteGuard>} />
                <Route path="/admin/products/edit/:id" element={<RouteGuard><ProductEdit /></RouteGuard>} />
                <Route path="/payments/test" element={<PaymentTest />} />
                <Route path="/dev/email-preview" element={<EmailPreview />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
