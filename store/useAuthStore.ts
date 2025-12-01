import { create } from 'zustand';
import { authService, workoutService, settingsService, dailyLogService } from '../services/pocketbase';
import { useStore } from './useStore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name: string } | null;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  syncFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: authService.isLoggedIn,
  isLoading: false,
  user: authService.user ? {
    id: authService.user.id,
    email: authService.user.email,
    name: authService.user.name || '',
  } : null,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const authData = await authService.login(email, password);
      set({
        isAuthenticated: true,
        user: {
          id: authData.record.id,
          email: authData.record.email,
          name: authData.record.name || '',
        },
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

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(email, password, name);
      set({
        isAuthenticated: true,
        user: {
          id: authService.user?.id || '',
          email,
          name,
        },
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
    authService.logout();
    set({
      isAuthenticated: false,
      user: null,
      error: null,
    });
  },

  checkAuth: () => {
    const isValid = authService.isLoggedIn;
    const user = authService.user;
    set({
      isAuthenticated: isValid,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name || '',
      } : null,
    });
  },

  syncFromCloud: async () => {
    if (!authService.isLoggedIn) return;

    const appStore = useStore.getState();

    try {
      // Fetch all data from Pocketbase
      const [cloudHistory, cloudTemplates, cloudSettings, cloudDailyLogs] = await Promise.all([
        workoutService.getHistory(),
        workoutService.getTemplates(),
        settingsService.get(),
        dailyLogService.getAll(),
      ]);

      // Merge with local data (cloud takes precedence for now)
      // In a real app, you'd want proper conflict resolution
      useStore.setState({
        history: cloudHistory.length > 0 ? cloudHistory : appStore.history,
        templates: cloudTemplates.length > 0 ? cloudTemplates : appStore.templates,
        settings: cloudSettings ? { ...appStore.settings, ...cloudSettings } : appStore.settings,
        dailyLogs: Object.keys(cloudDailyLogs).length > 0 ? cloudDailyLogs : appStore.dailyLogs,
        syncStatus: 'synced',
      });
    } catch (err) {
      console.error('Sync from cloud failed:', err);
      useStore.setState({ syncStatus: 'error' });
    }
  },

  syncToCloud: async () => {
    if (!authService.isLoggedIn) return;

    const { history, templates, settings, dailyLogs } = useStore.getState();

    try {
      useStore.setState({ syncStatus: 'syncing' });

      // Push settings
      await settingsService.save(settings);

      // Push history (completed workouts)
      for (const workout of history) {
        if (workout.status === 'completed') {
          await workoutService.create(workout);
        }
      }

      // Push templates
      for (const template of templates) {
        await workoutService.create(template);
      }

      // Push daily logs
      for (const [date, log] of Object.entries(dailyLogs)) {
        await dailyLogService.save(date, log);
      }

      useStore.setState({ syncStatus: 'synced' });
    } catch (err) {
      console.error('Sync to cloud failed:', err);
      useStore.setState({ syncStatus: 'error' });
    }
  },
}));

// Listen for auth changes
authService.onAuthChange((isValid) => {
  useAuthStore.getState().checkAuth();
});
