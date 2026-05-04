import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Pos from '@/pages/Pos';
import Sales from '@/pages/Sales';
import Inventory from '@/pages/Inventory';
import Products from '@/pages/Products';
import Purchase from '@/pages/Purchase';
import Members from '@/pages/Members';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();

  if (!state.user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (state.user && location.pathname === '/login') {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useApp();

  if (!state.user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/home" replace />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                path="/home"
                element={
                  <Layout>
                    <Home />
                  </Layout>
                }
              />
              <Route
                path="/pos"
                element={
                  <Layout>
                    <Pos />
                  </Layout>
                }
              />
              <Route
                path="/inventory"
                element={
                  <Layout>
                    <Inventory />
                  </Layout>
                }
              />
              <Route
                path="/products"
                element={
                  <Layout>
                    <Products />
                  </Layout>
                }
              />
              <Route
                path="/purchase"
                element={
                  <Layout>
                    <Purchase />
                  </Layout>
                }
              />
              <Route
                path="/sales"
                element={
                  <Layout>
                    <Sales />
                  </Layout>
                }
              />
              <Route
                path="/members"
                element={
                  <Layout>
                    <Members />
                  </Layout>
                }
              />
              <Route
                path="/analytics"
                element={
                  <Layout>
                    <Analytics />
                  </Layout>
                }
              />
              <Route
                path="/settings"
                element={
                  <Layout>
                    <Settings />
                  </Layout>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <AppRoutes />
      </HashRouter>
      <Toaster position="bottom-right" />
    </AppProvider>
  );
}
