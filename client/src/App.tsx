import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AvailableBooksPage from "@/pages/books/available";
import MyCollectionPage from "@/pages/books/my-collection";
import AddBookPage from "@/pages/books/add";
import BookDetailPage from "@/pages/books/info/[bookId]";
import ExchangesPage from "@/pages/exchanges/index";
import ProposeExchangePage from "@/pages/exchanges/propose";
import ExchangeChatPage from "@/pages/chat/exchange/[exchangeId]";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/books/available" component={AvailableBooksPage} />
      <ProtectedRoute path="/books/my-collection" component={MyCollectionPage} />
      <ProtectedRoute path="/books/add" component={AddBookPage} />
      <ProtectedRoute path="/books/info/:bookId" component={BookDetailPage} />
      <ProtectedRoute path="/exchanges" component={ExchangesPage} />
      <ProtectedRoute path="/exchanges/propose" component={ProposeExchangePage} />
      <ProtectedRoute path="/chat/exchange/:exchangeId" component={ExchangeChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set project-specific CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', '214 90% 54%');
    document.documentElement.style.setProperty('--primary-foreground', '211 100% 99%');
    document.documentElement.style.setProperty('--secondary', '45 100% 47%');
    document.documentElement.style.setProperty('--secondary-foreground', '26 83% 14%');
    document.documentElement.style.setProperty('--accent', '4 80% 54%');
    document.documentElement.style.setProperty('--accent-foreground', '0 0% 100%');
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
            <MobileNavigation />
            <Toaster />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
