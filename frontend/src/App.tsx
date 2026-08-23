import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import PublishedFormPage from "./pages/PublishedFormPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ManageableFormsPage from "./pages/ManageableFormsPage";
import FormResponsesPage from "./pages/FormResponsesPage";

function App() {
  return (
      <BrowserRouter>
          <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/forms/new" element={<FormBuilderPage />} />
                  <Route path="/forms/:publicId/edit" element={<FormBuilderPage />}/>
                  <Route path="/admin" element={<AdminPanelPage />} />
                  <Route path="/forms/:publicId/responses" element={<FormResponsesPage />}/>
                  <Route path="/forms" element={<ManageableFormsPage />}
                  />
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