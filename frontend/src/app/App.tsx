import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardOverviewPage } from "../features/dashboard/DashboardOverviewPage";
import {
  DemoCorpusPage,
  HowChecksWorkPage,
  NewAnalysisShellPage,
} from "../features/dashboard/WorkspacePlaceholderPages";
import { HeroPage } from "../features/hero/HeroPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HeroPage />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardOverviewPage />} />
        <Route path="/analyze" element={<NewAnalysisShellPage />} />
        <Route path="/corpus" element={<DemoCorpusPage />} />
        <Route path="/how-it-works" element={<HowChecksWorkPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
