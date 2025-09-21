import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import About from "./pages/About";
import { ListingWizard } from "./components/listing/ListingWizard";
import { LandlordDashboard } from "./pages/LandlordDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import ListingDetails from "./pages/ListingDetails";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import UserTypeSelection from "./pages/UserTypeSelection";
import SignupPrivate from "./pages/SignupPrivate";
import SignupStudent from "./pages/SignupStudent";
import EditListing from "./pages/EditListing";
import MyBookings from "./pages/MyBookings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<Search />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/get-started" element={<UserTypeSelection />} />
          <Route path="/signup/private" element={<SignupPrivate />} />
          <Route path="/signup/student" element={<SignupStudent />} />
          <Route path="/about" element={<About />} />
          <Route path="/create-listing" element={<ListingWizard />} />
          <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;