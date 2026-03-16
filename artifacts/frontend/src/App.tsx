import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CountProvider } from "@/context/CountContext";
import Home from "@/pages/Home";

// Provide a custom 404 for Wouter inside the App
function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-display font-black neon-text opacity-30 mb-4">404</h1>
      <h2 className="text-lg font-display font-bold tracking-wider uppercase neon-text">PATH_NOT_FOUND</h2>
      <p className="mt-2 text-muted-foreground text-[11px] font-mono">The requested endpoint does not exist.</p>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CountProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </CountProvider>
    </QueryClientProvider>
  );
}

export default App;
