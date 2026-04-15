import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import EventTypes from "./pages/EventTypes";
import Bookings from "./pages/Bookings";
import Availability from "./pages/Availability";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";
import { UserProvider } from "@/contexts/UserContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/event-types" element={<EventTypes />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/:username/:slug" element={<PublicBooking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
