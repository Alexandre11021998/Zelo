import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import CompanionLogin from "./pages/CompanionLogin";
import HospitalLogin from "./pages/HospitalLogin";
import StaffSignup from "./pages/StaffSignup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdmin from "./pages/SuperAdmin";
import TeamManagement from "./pages/TeamManagement";
import CheckIn from "./pages/CheckIn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login-hospital" replace />;
  }

  return <>{children}</>;
}

// Route for managers (admin only, not colaborador) - used for team management
function ProtectedManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isSuperAdmin, isColaborador, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Block colaboradores - they should not access team management
  if (!user || (!isAdmin && !isSuperAdmin) || (isColaborador && !isAdmin)) {
    return <Navigate to="/gestao-hospitalar" replace />;
  }

  return <>{children}</>;
}

function ProtectedStaffRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isColaborador, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isColaborador)) {
    return <Navigate to="/login-hospital" replace />;
  }

  return <>{children}</>;
}

function ProtectedSuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/login-superadmin" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/acompanhante" element={<CompanionLogin />} />
            <Route path="/login-hospital" element={<HospitalLogin />} />
            <Route path="/cadastro-colaborador" element={<StaffSignup />} />
            <Route path="/cadastro-equipe" element={<StaffSignup />} />
            <Route path="/login-superadmin" element={<SuperAdminLogin />} />
            {/* Legacy routes redirect */}
            <Route path="/login-admin" element={<Navigate to="/login-hospital" replace />} />
            <Route path="/registrar-admin" element={<Navigate to="/cadastro-colaborador" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedAdminRoute>
                  <Dashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/gestao-hospitalar"
              element={
                <ProtectedStaffRoute>
                  <AdminDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/recepcao"
              element={
                <ProtectedStaffRoute>
                  <AdminDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <ProtectedSuperAdminRoute>
                  <SuperAdmin />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/equipe"
              element={
                <ProtectedManagerRoute>
                  <TeamManagement />
                </ProtectedManagerRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
