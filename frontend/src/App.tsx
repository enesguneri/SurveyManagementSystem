import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";
import DashboardPage from "./pages/DashboardPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import PublishedFormPage from "./pages/PublishedFormPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ManageableFormsPage from "./pages/ManageableFormsPage";
import FormResponsesPage from "./pages/FormResponsesPage";
import AiSurveyAssistantPage from "./pages/AiSurveyAssistantPage";

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
                  <Route path="/forms/:publicId/responses" element={<FormResponsesPage />}/>
                  <Route path="/ai/survey" element={<AiSurveyAssistantPage />}/>
                  <Route path="/forms" element={<ManageableFormsPage />} />

                  {/* 👑 Sadece Admin Rolüne Sahip Kullanıcılar Erişebilir */}
                  <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminPanelPage />} />
                  </Route>
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