import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import ModuleDetail from "./pages/ModuleDetail";
import Board from "./pages/Board";
import Curriculum from "./pages/Curriculum";
import Learn from "./pages/Learn";
import About from "./pages/About";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/auth" component={Auth} />
        <Route path="/module/:id" component={ModuleDetail} />
        <Route path="/module/:id/:section" component={ModuleDetail} />
        <Route path="/board/:category" component={Board} />
        <Route path="/board/:category/:id" component={Board} />
        <Route path="/curriculum" component={Curriculum} />
        <Route path="/learn" component={Learn} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
