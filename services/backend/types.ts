import type { WorkoutSession, UserSettings, DailyLog, Program } from '../../types';

/**
 * User object returned by authentication
 */
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  user: BackendUser;
  token?: string;
}

/**
 * Unified backend service interface
 * Supports both Firebase and PocketBase implementations
 */
export interface BackendService {
  /**
   * Authentication methods
   */
  auth: {
    /** Check if user is currently logged in */
    isLoggedIn: boolean;

    /** Get current user or null */
    user: BackendUser | null;

    /** Email/password login */
    login(email: string, password: string): Promise<AuthResult>;

    /** Register new user with email/password */
    register(email: string, password: string, name: string): Promise<AuthResult>;

    /** Google OAuth login */
    loginWithGoogle(): Promise<AuthResult>;

    /** Apple OAuth login */
    loginWithApple(): Promise<AuthResult>;

    /** Logout current user */
    logout(): Promise<void>;

    /** Listen for auth state changes */
    onAuthChange(callback: (user: BackendUser | null) => void): () => void;
  };

  /**
   * Workout data sync
   */
  workouts: {
    /** Get all workouts for current user */
    getAll(): Promise<WorkoutSession[]>;

    /** Get only templates */
    getTemplates(): Promise<WorkoutSession[]>;

    /** Get workout history (completed workouts) */
    getHistory(): Promise<WorkoutSession[]>;

    /** Create new workout */
    create(workout: WorkoutSession): Promise<WorkoutSession>;

    /** Update existing workout */
    update(id: string, workout: Partial<WorkoutSession>): Promise<WorkoutSession>;

    /** Delete workout */
    delete(id: string): Promise<void>;

    /** Subscribe to real-time updates */
    subscribe(callback: (action: 'create' | 'update' | 'delete', record: WorkoutSession) => void): () => void;
  };

  /**
   * User settings sync
   */
  settings: {
    /** Get user settings */
    get(): Promise<UserSettings | null>;

    /** Save user settings */
    save(settings: UserSettings): Promise<void>;
  };

  /**
   * Daily logs sync
   */
  dailyLogs: {
    /** Get all daily logs */
    getAll(): Promise<Record<string, DailyLog>>;

    /** Save a single daily log */
    save(date: string, log: DailyLog): Promise<void>;
  };

  /**
   * Programs sync
   */
  programs: {
    /** Get all programs */
    getAll(): Promise<Program[]>;

    /** Create new program */
    create(program: Program): Promise<Program>;

    /** Update program */
    update(id: string, program: Partial<Program>): Promise<Program>;

    /** Delete program */
    delete(id: string): Promise<void>;
  };

  /**
   * Cloud storage for images/files
   */
  storage: {
    /** Upload image and return URL */
    uploadImage(id: string, dataUrl: string): Promise<string>;

    /** Get image URL by ID */
    getImageUrl(id: string): Promise<string | null>;

    /** Get all images for current user */
    getAllImages(): Promise<Record<string, string>>;

    /** Delete image */
    deleteImage(id: string): Promise<void>;
  };
}

/**
 * Backend configuration
 */
export interface BackendConfig {
  type: 'firebase' | 'pocketbase';
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  pocketbase?: {
    url: string;
  };
}
