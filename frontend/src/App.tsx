import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import PublishedFormPage from "./pages/PublishedFormPage";

function App() {
  return (
      <BrowserRouter>
          <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/forms/new" element={<FormBuilderPage />} />
              </Route>

              <Route
                  path="/forms/:publicId"
                  element={<PublishedFormPage />}
              />

              <Route
                  path="*"
                  element={<Navigate to="/login" replace />}
              />
          </Routes>
      </BrowserRouter>
  );
}

export default App;