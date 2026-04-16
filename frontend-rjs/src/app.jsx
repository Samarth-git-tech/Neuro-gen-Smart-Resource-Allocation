import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TaskCreatePage from "./pages/TaskCreatePage";
import CommunityInputPage from "./pages/CommunityInputPage";
import AIBoardPage from "./pages/AIBoardPage";
import StatsPage from "./pages/StatsPage";
import MembersPage from "./pages/MembersPage";
import MapPage from "./pages/MapPage";

function AppLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — require Firebase auth */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute><TaskCreatePage /></ProtectedRoute>
        } />
        <Route path="/inputs" element={
          <ProtectedRoute><CommunityInputPage /></ProtectedRoute>
        } />
        <Route path="/ai-board" element={
          <ProtectedRoute><AIBoardPage /></ProtectedRoute>
        } />
        <Route path="/stats" element={
          <ProtectedRoute><StatsPage /></ProtectedRoute>
        } />
        <Route path="/members" element={
          <ProtectedRoute><MembersPage /></ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute><MapPage /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>   {/* 🔥 ADD THIS WRAPPER */}
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
