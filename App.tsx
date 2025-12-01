
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Calendar, User, Play, Timer } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Lift from './pages/Lift';
import WorkoutLogger from './pages/WorkoutLogger';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Landing4 from './pages/landings/Landing4';
import ProgramBuilder from './pages/ProgramBuilder';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';

const BottomNav = () => {
  const location = useLocation();
  const { activeWorkout, restTimerStart } = useStore();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;
  
  // Hide nav on onboarding, welcome, and login
  if (location.pathname === '/onboarding' || location.pathname === '/welcome' || location.pathname === '/login') return null;
  
  const handlePlayClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (activeWorkout) {
          navigate('/workout');
      } else {
          navigate('/lift');
      }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#333] px-6 py-4 flex justify-between items-center z-50 safe-area-bottom">
      <LinkItem to="/" icon={<Home size={22} />} label="HOME" active={isActive('/')} />
      <LinkItem to="/lift" icon={<Dumbbell size={22} />} label="LIFT" active={isActive('/lift')} />
      
      <div className="relative -top-6">
        <button 
            onClick={handlePlayClick} 
            className={`flex items-center justify-center w-16 h-16 rounded-lg shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-transform active:scale-95 ${activeWorkout || restTimerStart ? 'bg-primary animate-pulse text-black' : 'bg-primary text-black'}`}
        >
          {restTimerStart ? (
              <Timer size={28} strokeWidth={2.5} className="animate-spin-slow" />
          ) : (
              <Play size={28} fill="currentColor" strokeWidth={2.5} />
          )}
        </button>
      </div>

      <LinkItem to="/history" icon={<Calendar size={22} />} label="LOGS" active={isActive('/history')} />
      <LinkItem to="/profile" icon={<User size={22} />} label="YOU" active={isActive('/profile')} />
    </nav>
  );
};

const LinkItem = ({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) => (
  <Link to={to} className={`flex flex-col items-center gap-1.5 transition-colors ${active ? 'text-primary' : 'text-[#444]'} hover:text-white`}>
    {icon}
    <span className="text-[10px] font-black italic tracking-wider">{label}</span>
  </Link>
);

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useStore();
  if (!settings.onboardingCompleted) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

// Need separate component to use useNavigate in BottomNav
const AppContent = () => {
  return (
    <div className="min-h-screen bg-background text-text pb-28 font-sans selection:bg-primary selection:text-black">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/welcome" element={<Landing4 />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/lift" element={<ProtectedRoute><Lift /></ProtectedRoute>} />
          <Route path="/builder" element={<ProtectedRoute><ProgramBuilder /></ProtectedRoute>} />
          <Route path="/exercises" element={<ProtectedRoute><ExerciseLibrary /></ProtectedRoute>} />
          <Route path="/workout" element={<ProtectedRoute><WorkoutLogger /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/history/:id" element={<ProtectedRoute><HistoryDetail /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <BottomNav />
      </div>
  );
}

const App = () => {
  const { loadVisuals } = useStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check auth status on startup
    checkAuth();
    // Hydrate heavy assets from IndexedDB on startup
    loadVisuals();
  }, [loadVisuals, checkAuth]);

  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
