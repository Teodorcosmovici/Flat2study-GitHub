import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";
import { ChatButton } from "@/components/ui/whatsapp-chat-button";
import { ImpersonationBanner } from "./components/admin/ImpersonationBanner";

import Index from "./pages/Index";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import About from "./pages/About";
import { ListingWizard } from "./components/listing/ListingWizard";
import { LandlordDashboard } from "./pages/LandlordDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import LandlordLanding from "./pages/LandlordLanding";
import ListingDetails from "./pages/ListingDetails";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import UserTypeSelection from "./pages/UserTypeSelection";
import SignupPrivate from "./pages/SignupPrivate";
import SignupStudent from "./pages/SignupStudent";
import EditListing from "./pages/EditListing";
import MyBookings from "./pages/MyBookings";
import OwnerDashboard from "./pages/OwnerDashboard";
import CustomerDatabase from "./pages/CustomerDatabase";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import CheckoutSuccess from "./pages/checkout/Success";
import CheckoutCancel from "./pages/checkout/Cancel";

// Lazy load Checkout to avoid bundle size issues
import { lazy, Suspense } from "react";
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutLazy = () => (
  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
    <Checkout />
  </Suspense>
);

const queryClient = new QueryClient();

const AppRoutes = () => {
  usePageTracking();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/search" element={<Search />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/get-started" element={<UserTypeSelection />} />
      <Route path="/landlord" element={<LandlordLanding />} />
      <Route path="/signup/private" element={<SignupPrivate />} />
      <Route path="/signup/student" element={<SignupStudent />} />
      <Route path="/about" element={<About />} />
      <Route path="/create-listing" element={<ListingWizard />} />
      <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
      <Route path="/my-listings" element={<LandlordDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/edit-listing/:id" element={<EditListing />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/listing/:id" element={<ListingDetails />} />
      <Route path="/checkout/:id" element={<CheckoutLazy />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/owner-dashboard" element={<OwnerDashboard />} />
      <Route path="/customer-database" element={<CustomerDatabase />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-canceled" element={<PaymentCanceled />} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/checkout/cancel" element={<CheckoutCancel />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <ImpersonationBanner />
        <AppRoutes />
        <ChatButton />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;