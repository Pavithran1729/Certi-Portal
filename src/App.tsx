import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/student/Register";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentApplications from "./pages/student/Applications";
import AdminDashboard from "./pages/admin/Dashboard";
import AuthorityDashboard from "./pages/authority/Dashboard";
import MyCertificates from "./pages/student/MyCertificates";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
// Certificate Request Pages
import TCPage from "./pages/student/certificates/TC";
import BonafidePage from "./pages/student/certificates/Bonafide";
import AttendancePage from "./pages/student/certificates/Attendance";
import ConductPage from "./pages/student/certificates/Conduct";
import TrainingPage from "./pages/student/certificates/Training";
import CourseCompletionPage from "./pages/student/certificates/CourseCompletion";
import InternshipPage from "./pages/student/certificates/Internship";
import CustomCertificatePage from "./pages/student/certificates/Custom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/student/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "hod"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/dashboard"
            element={
              <ProtectedRoute allowedRoles={["authority"]}>
                <AuthorityDashboard />
              </ProtectedRoute>
            }
          />
          {/* Certificate Request Routes */}
          <Route
            path="/student/certificates/tc"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <TCPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates/bonafide"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <BonafidePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates/attendance"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates/conduct"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ConductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates/training"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <TrainingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates/course_completion"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <CourseCompletionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates/internship"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <InternshipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates/custom/:templateId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <CustomCertificatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-certificates"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <MyCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["student", "admin", "hod", "authority"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
