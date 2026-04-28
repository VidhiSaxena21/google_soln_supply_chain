import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import RequestsPage from "@/pages/requests";
import NewRequestPage from "@/pages/new-request";
import RequestDetailPage from "@/pages/request-detail";
import TrackingPage from "@/pages/tracking";
import AgreementsPage from "@/pages/agreements";
import DisputesPage from "@/pages/disputes";
import DisputeDetailPage from "@/pages/dispute-detail";
import NotificationsPage from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (user) return <Redirect to="/" />;

  return <Component />;
}

function HomeRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (!user) return <LandingPage />;

  return (
    <Layout>
      <DashboardPage />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <AuthRoute component={LoginPage} />} />
      <Route path="/register" component={() => <AuthRoute component={RegisterPage} />} />
      <Route path="/" component={HomeRoute} />
      <Route path="/requests/new" component={() => <ProtectedRoute component={NewRequestPage} />} />
      <Route path="/requests/:id" component={() => <ProtectedRoute component={RequestDetailPage} />} />
      <Route path="/requests" component={() => <ProtectedRoute component={RequestsPage} />} />
      <Route path="/tracking/:id" component={() => <ProtectedRoute component={TrackingPage} />} />
      <Route path="/agreements" component={() => <ProtectedRoute component={AgreementsPage} />} />
      <Route path="/disputes/:id" component={() => <ProtectedRoute component={DisputeDetailPage} />} />
      <Route path="/disputes" component={() => <ProtectedRoute component={DisputesPage} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
