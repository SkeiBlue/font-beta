import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { UploadPage } from "./pages/Upload";
import { AnalyzePage } from "./pages/Analyze";
import { SharePage } from "./pages/Share";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/upload" element={<UploadPage />} />
          <Route path="/app/analyze" element={<AnalyzePage />} />
          <Route path="/app/share" element={<SharePage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
