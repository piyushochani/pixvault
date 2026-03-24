import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import IntroPage       from "./pages/IntroPage";
import OverviewPage    from "./pages/OverviewPage";
import AllImagesPage   from "./pages/AllImagesPage";
import FolderPage      from "./pages/FolderPage";
import RecycleBinPage  from "./pages/RecycleBinPage";
import Header          from "./components/Header";

function ProtectedLayout({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/overview" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <PublicRoute><IntroPage /></PublicRoute>
          } />
          <Route path="/overview" element={
            <ProtectedLayout><OverviewPage /></ProtectedLayout>
          } />
          <Route path="/images" element={
            <ProtectedLayout><AllImagesPage /></ProtectedLayout>
          } />
          <Route path="/folders" element={
            <ProtectedLayout><FolderPage /></ProtectedLayout>
          } />
          <Route path="/recycle" element={
            <ProtectedLayout><RecycleBinPage /></ProtectedLayout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}