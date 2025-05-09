import { Switch, Route, useLocation } from "wouter";
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
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { isRTL } from "@/lib/i18n";
import { Helmet } from "react-helmet";

// Componente di transizione animata
const AnimatedRouter = () => {
  const [location] = useLocation();
  
  // Cambia le animazioni in base al percorso della pagina
  const getTransitionClass = () => {
    if (location.startsWith('/books')) {
      return 'books-section';
    } else if (location.startsWith('/exchanges')) {
      return 'exchanges-section';
    } else if (location.startsWith('/chat')) {
      return 'chat-section';
    } else if (location === '/auth') {
      return 'auth-section';
    } else if (location === '/') {
      return 'home-section';
    }
    return '';
  };
  
  return (
    <div className={`page-transition ${getTransitionClass()}`}>
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
    </div>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  
  // Imposta variabili CSS specifiche del progetto
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', '214 90% 54%');
    document.documentElement.style.setProperty('--primary-foreground', '211 100% 99%');
    document.documentElement.style.setProperty('--secondary', '45 100% 47%');
    document.documentElement.style.setProperty('--secondary-foreground', '26 83% 14%');
    document.documentElement.style.setProperty('--accent', '4 80% 54%');
    document.documentElement.style.setProperty('--accent-foreground', '0 0% 100%');
    
    // Indica che l'app è caricata
    setIsAppLoaded(true);
  }, []);
  
  // Gestione lingue RTL e aggiornamento della configurazione della pagina
  useEffect(() => {
    // Utilizza l'helper per verificare se la lingua è RTL
    const currentIsRTL = isRTL(i18n.language);
    document.documentElement.dir = currentIsRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    
    // Aggiungi o rimuovi la classe RTL dal body
    if (currentIsRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Carica il font appropriato per la lingua
    if (i18n.language === 'ar') {
      // Carica font arabo
      document.body.classList.add('font-arabic');
    } else if (i18n.language === 'zh') {
      // Carica font cinese
      document.body.classList.add('font-chinese');
    } else {
      // Rimuovi classi font specifiche
      document.body.classList.remove('font-arabic', 'font-chinese');
    }
  }, [i18n.language]);
  
  // Aggiungi classe dinamica per ombre e animazioni
  const appClasses = `flex flex-col min-h-screen ${isAppLoaded ? 'app-loaded' : 'app-loading'}`;
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Helmet>
            <title>{t('app.name')} - {t('app.slogan')}</title>
            <meta name="description" content={t('app.description')} />
            <meta property="og:title" content={t('app.name')} />
            <meta property="og:description" content={t('app.slogan')} />
            <meta name="theme-color" content="#3b82f6" />
          </Helmet>
          <div className={appClasses}>
            <Header />
            <main className="flex-grow transition-all duration-300 ease-in-out">
              <AnimatedRouter />
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
