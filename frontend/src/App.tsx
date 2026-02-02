import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ApplicationProvider } from "./contexts/ApplicationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Toaster from "./components/Toaster";

// Auth pages
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";

// Recruiter pages
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobForm from "./pages/JobForm";
import JobDetail from "./pages/JobDetail";
import ResumesList from "./pages/ResumesList";
import AIAnalysis from "./pages/AIAnalysis";
import Dashboard from "./pages/Dashboard";
// Candidate pages
import CandidateDashboard from "./pages/CandidateDashboard";
import ResumeAnalysis from "./pages/ResumeAnalysis";

import NotFound from "./pages/NotFound";
import JobsManagement from "./pages/JobsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Recruiter routes */}
          <Route path="/ia-analysis" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Candidate routes */}
          <Route path="/candidate-dashboard" element={<ProtectedRoute><ApplicationProvider><CandidateDashboard /></ApplicationProvider></ProtectedRoute>} />
          <Route path="/analysis" element={<ProtectedRoute><ApplicationProvider><ResumeAnalysis /></ApplicationProvider></ProtectedRoute>} />

          {/* Other routes */}
          <Route path="/jobs" element={<ProtectedRoute><JobsManagement /></ProtectedRoute>} />
          <Route path="/jobs/new" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
          <Route path="/jobs/:id/edit" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
          <Route path="/resumes" element={<ProtectedRoute><ResumesList /></ProtectedRoute>} />
          <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysis /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
