import { create } from 'zustand';
import { backend } from '../services/backend';
import { useStore } from './useStore';

interface AuthState {
  isAuthenticated: boolean;
  isAuthLoading: boolean; // Track Firebase auth initialization
  isLoading: boolean;
  user: { id: string; email: string; name: string; photoURL?: string } | null;
  error: string | null;

  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<boolean>;
  loginWithApple: (rememberMe?: boolean) => Promise<boolean>;
  register: (email: string, password: string, name: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  syncFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: backend.auth.isLoggedIn,
  isAuthLoading: true, // Start as true, will be set to false once Firebase initializes
  isLoading: false,
  user: backend.auth.user,
  error: null,

  login: async (email, password, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await backend.auth.login(email, password, rememberMe);
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      // Sync data after login
      await get().syncFromCloud();
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Login failed',
        isLoading: false,
      });
      return false;
    }
  },

  loginWithGoogle: async (rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await backend.auth.loginWithGoogle(rememberMe);
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      // Sync data after login
      await get().syncFromCloud();
      return true;
    } catch (err: any) {
      // Handle redirect - this is not an error, just a pending redirect
      if (err.message === 'REDIRECT_PENDING') {
        console.log('🔄 Redirecting to Google Sign-In...');
        // Keep loading state, don't show error
        set({ isLoading: true, error: null });
        return false;
      }

      set({
        error: err.message || 'Google Sign-In failed',
        isLoading: false,
      });
      return false;
    }
  },

  loginWithApple: async (rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await backend.auth.loginWithApple(rememberMe);
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      // Sync data after login
      await get().syncFromCloud();
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Apple Sign-In failed',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (email, password, name, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await backend.auth.register(email, password, name, rememberMe);
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      // Push local data to cloud after registration
      await get().syncToCloud();
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Registration failed',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    backend.auth.logout();
    set({
      isAuthenticated: false,
      user: null,
      error: null,
    });
  },

  checkAuth: () => {
    console.log('🔍 Checking auth status...');
    const isValid = backend.auth.isLoggedIn;
    const user = backend.auth.user;
    console.log('✅ Auth check complete:', { isValid, user: user?.email });
    set({
      isAuthenticated: isValid,
      user,
      isAuthLoading: false, // Important: Mark auth initialization as complete
    });
  },

  syncFromCloud: async () => {
    if (!backend.auth.isLoggedIn) return;

    const appStore = useStore.getState();

    try {
      // Fetch all data from backend
      const [cloudHistory, cloudTemplates, cloudSettings, cloudDailyLogs, cloudPrograms] = await Promise.all([
        backend.workouts.getHistory(),
        backend.workouts.getTemplates(),
        backend.settings.get(),
        backend.dailyLogs.getAll(),
        backend.programs.getAll(),
      ]);

      // Merge with local data (cloud takes precedence for now)
      // In a real app, you'd want proper conflict resolution
      useStore.setState({
        history: cloudHistory.length > 0 ? cloudHistory : appStore.history,
        templates: cloudTemplates.length > 0 ? cloudTemplates : appStore.templates,
        settings: cloudSettings ? { ...appStore.settings, ...cloudSettings } : appStore.settings,
        dailyLogs: Object.keys(cloudDailyLogs).length > 0 ? cloudDailyLogs : appStore.dailyLogs,
        programs: cloudPrograms.length > 0 ? cloudPrograms : appStore.programs,
        syncStatus: 'synced',
      });

      // Sync images
      try {
        const cloudImages = await backend.storage.getAllImages();
        if (Object.keys(cloudImages).length > 0) {
          useStore.setState({ customExerciseVisuals: cloudImages });
        }
      } catch (err) {
        console.error('Failed to sync images:', err);
      }
    } catch (err) {
      console.error('Sync from cloud failed:', err);
      useStore.setState({ syncStatus: 'error' });
    }
  },

  syncToCloud: async () => {
    if (!backend.auth.isLoggedIn) return;

    const { history, templates, settings, dailyLogs, programs, customExerciseVisuals } = useStore.getState();

    try {
      useStore.setState({ syncStatus: 'syncing' });

      // Push settings
      await backend.settings.save(settings);

      // Push history (completed workouts)
      for (const workout of history) {
        if (workout.status === 'completed') {
          await backend.workouts.create(workout);
        }
      }

      // Push templates
      for (const template of templates) {
        await backend.workouts.create(template);
      }

      // Push daily logs
      for (const [date, log] of Object.entries(dailyLogs)) {
        await backend.dailyLogs.save(date, log);
      }

      // Push programs
      for (const program of programs) {
        await backend.programs.create(program);
      }

      // Push images
      for (const [id, dataUrl] of Object.entries(customExerciseVisuals)) {
        try {
          await backend.storage.uploadImage(id, dataUrl);
        } catch (err) {
          console.error(`Failed to upload image ${id}:`, err);
        }
      }

      useStore.setState({ syncStatus: 'synced' });
    } catch (err) {
      console.error('Sync to cloud failed:', err);
      useStore.setState({ syncStatus: 'error' });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Listen for auth changes
backend.auth.onAuthChange((user) => {
  useAuthStore.setState({
    isAuthenticated: !!user,
    isAuthLoading: false, // Auth state has been determined
    user,
  });
});
