
import React, { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Calendar, User, Play, Timer } from 'lucide-react';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import NotificationScheduler from './components/NotificationScheduler';
import OfflineIndicator from './components/OfflineIndicator';
import ScrollToTop from './components/ScrollToTop';
import WorkoutRecoveryPrompt from './components/WorkoutRecoveryPrompt';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import { initializeNotificationListeners } from './services/notificationService';
import DesktopLayout from './components/desktop/DesktopLayout';
import { preloadMLModules } from './services/ml';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'));
const Lift = lazy(() => import('./pages/Lift'));
const WorkoutLogger = lazy(() => import('./pages/WorkoutLogger'));
const History = lazy(() => import('./pages/History'));
const HistoryDetail = lazy(() => import('./pages/HistoryDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Landing4 = lazy(() => import('./pages/landings/Landing4'));
const ProgramBuilder = lazy(() => import('./pages/ProgramBuilder'));
const ProgramBrowser = lazy(() => import('./pages/ProgramBrowser'));
const ProgramDetail = lazy(() => import('./pages/ProgramDetail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Login = lazy(() => import('./pages/Login'));

// Desktop Dashboard Pages
const DesktopOverview = lazy(() => import('./pages/desktop/Overview'));
const DesktopAnalytics = lazy(() => import('./pages/desktop/Analytics'));
const DesktopCalendar = lazy(() => import('./pages/desktop/Calendar'));
const DesktopPrograms = lazy(() => import('./pages/desktop/Programs'));
const DesktopData = lazy(() => import('./pages/desktop/Data'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-primary font-black text-sm uppercase tracking-widest italic animate-pulse">POWERING UP</p>
    </div>
  </div>
);

const BottomNav = () => {
  const location = useLocation();
  const { activeWorkout, restTimerStart, settings, programs, templates, startWorkout } = useStore();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  // Hide nav on onboarding, welcome, login, desktop routes, and on the workout page
  if (location.pathname === '/onboarding' ||
      location.pathname === '/welcome' ||
      location.pathname === '/login' ||
      location.pathname.startsWith('/desktop') ||
      location.pathname === '/workout') return null;

  // Check if there's an active program and get next session
  let nextProgramTemplate = null;
  if (settings.activeProgram && !activeWorkout) {
      const prog = programs.find(p => p.id === settings.activeProgram?.programId);
      if (prog) {
          const sessionIndex = settings.activeProgram.currentSessionIndex;
          const session = prog.sessions[sessionIndex];
          nextProgramTemplate = templates.find(t => t.id === session?.templateId);
      }
  }

  const handlePlayClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeWorkout) {
          // Continue active workout
          navigate('/workout');
      } else if (nextProgramTemplate) {
          // Start next program session
          startWorkout(nextProgramTemplate.id);
          navigate('/workout');
      } else {
          // No program, go to lift page to choose
          navigate('/lift');
      }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#333] px-6 py-4 flex justify-between items-center z-50"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      aria-label="Main navigation"
      role="navigation"
    >
      <LinkItem to="/" icon={<Home size={22} />} label="HOME" active={isActive('/')} />
      <LinkItem to="/lift" icon={<Dumbbell size={22} />} label="LIFT" active={isActive('/lift')} />

      <div className="relative -top-6">
        <button
            onClick={handlePlayClick}
            onTouchStart={handlePlayClick}
            aria-label={activeWorkout ? "Continue active workout" : nextProgramTemplate ? "Start next program session" : "Start workout"}
            className={`flex items-center justify-center w-16 h-16 rounded shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-transform active:scale-95 cursor-pointer ${activeWorkout || restTimerStart ? 'bg-primary animate-pulse text-black' : 'bg-primary text-black'}`}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'rgba(204, 255, 0, 0.2)' }}
        >
          {restTimerStart ? (
              <Timer size={28} strokeWidth={2.5} aria-hidden="true" className="animate-spin-slow" />
          ) : (
              <Play size={28} fill="currentColor" strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>
      </div>

      <LinkItem to="/history" icon={<Calendar size={22} />} label="LOGS" active={isActive('/history')} />
      <LinkItem to="/profile" icon={<User size={22} />} label="YOU" active={isActive('/profile')} />
    </nav>
  );
};

const LinkItem = ({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex flex-col items-center gap-1.5 transition-colors ${active ? 'text-primary' : 'text-[#444]'} hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black`}
    aria-label={label}
    aria-current={active ? 'page' : undefined}
  >
    <span aria-hidden="true">{icon}</span>
    <span className="text-[10px] font-black italic tracking-wider">{label}</span>
  </Link>
);

// Onboarding guard - only allows authenticated users
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAuthLoading } = useAuthStore();

  // Wait for Firebase to check persisted auth state
  if (isAuthLoading) {
    return <PageLoader />;
  }

  // Must be authenticated to access onboarding
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useStore();
  const { isAuthenticated, isAuthLoading } = useAuthStore();
  const location = useLocation();

  // TEMPORARY: Bypass auth for testing Phase 3 features
  const TESTING_MODE = localStorage.getItem('TESTING_MODE') === 'true';
  if (TESTING_MODE) {
    return <>{children}</>;
  }

  // Wait for Firebase to check persisted auth state
  if (isAuthLoading) {
    return <PageLoader />;
  }

  // First check: Must be authenticated
  if (!isAuthenticated) {
    // Save current path to localStorage so we can return here after login
    localStorage.setItem('returnUrl', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Second check: Must complete onboarding
  if (!settings.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Need separate component to use useNavigate in BottomNav
const AppContent = () => {
  const location = useLocation();
  const isWorkoutPage = location.pathname === '/workout';

  return (
    <div className={`min-h-screen bg-background text-text font-sans selection:bg-primary selection:text-black ${isWorkoutPage ? '' : 'pb-28'}`}>
        {/* Scroll to top on route change */}
        <ScrollToTop />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Background notification scheduler */}
        <NotificationScheduler />

        {/* Workout recovery prompt for interrupted sessions */}
        <WorkoutRecoveryPrompt />

        {/* Sync status indicator */}
        <SyncStatusIndicator />

        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/welcome" element={<Landing4 />} />
            <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

            {/* Desktop Dashboard Routes */}
            <Route path="/desktop" element={<ProtectedRoute><DesktopLayout><DesktopOverview /></DesktopLayout></ProtectedRoute>} />
            <Route path="/desktop/analytics" element={<ProtectedRoute><DesktopLayout><DesktopAnalytics /></DesktopLayout></ProtectedRoute>} />
            <Route path="/desktop/calendar" element={<ProtectedRoute><DesktopLayout><DesktopCalendar /></DesktopLayout></ProtectedRoute>} />
            <Route path="/desktop/programs" element={<ProtectedRoute><DesktopLayout><DesktopPrograms /></DesktopLayout></ProtectedRoute>} />
            <Route path="/desktop/data" element={<ProtectedRoute><DesktopLayout><DesktopData /></DesktopLayout></ProtectedRoute>} />

            {/* Mobile App Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/lift" element={<ProtectedRoute><Lift /></ProtectedRoute>} />
            <Route path="/builder" element={<ProtectedRoute><ProgramBuilder /></ProtectedRoute>} />
            <Route path="/programs" element={<ProtectedRoute><ProgramBrowser /></ProtectedRoute>} />
            <Route path="/program/:programId" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><ExerciseLibrary /></ProtectedRoute>} />
            <Route path="/workout" element={<ProtectedRoute><WorkoutLogger /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/history/:id" element={<ProtectedRoute><HistoryDetail /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
  );
}

const App = () => {
  const { loadVisuals } = useStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Hide Capacitor splash screen
    const hideSplash = async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch (e) {
        // Not running in Capacitor, ignore
        console.log('Not running in Capacitor environment');
      }
    };
    hideSplash();

    // Check auth status on startup
    checkAuth();
    // Hydrate heavy assets from IndexedDB on startup
    loadVisuals();

    // Initialize notification listeners
    initializeNotificationListeners();

    // Preload lightweight ML modules in background (TensorFlow.js loads on-demand)
    preloadMLModules();

    // Register service worker for PWA (only in web, not native)
    if ('serviceWorker' in navigator && !window.matchMedia('(display-mode: standalone)').matches) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [loadVisuals, checkAuth]);

  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
