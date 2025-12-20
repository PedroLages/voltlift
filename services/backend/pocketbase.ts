import PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import type { BackendService, BackendUser, AuthResult, BackendConfig } from './types';
import type { WorkoutSession, UserSettings, DailyLog, Program, ExerciseLog } from '../../types';

/**
 * PocketBase record types
 */
interface PBWorkout extends RecordModel {
  user: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'template';
  sourceTemplateId?: string;
  logs: ExerciseLog[];
  biometrics?: { timestamp: number; heartRate: number }[];
}

interface PBUserSettings extends RecordModel {
  user: string;
  settings: UserSettings;
}

interface PBDailyLog extends RecordModel {
  user: string;
  date: string;
  data: DailyLog;
}

interface PBProgram extends RecordModel {
  user: string;
  program: Program;
}

/**
 * PocketBase backend implementation
 */
export class PocketBaseBackend implements BackendService {
  private pb: PocketBase;
  private currentUser: BackendUser | null = null;

  constructor(config: BackendConfig['pocketbase']) {
    if (!config) {
      throw new Error('PocketBase configuration is required');
    }

    this.pb = new PocketBase(config.url);
    this.pb.autoCancellation(false);

    // Initialize current user
    if (this.pb.authStore.isValid && this.pb.authStore.model) {
      this.currentUser = this.mapPBUser(this.pb.authStore.model);
    }
  }

  /**
   * Map PocketBase user to BackendUser
   */
  private mapPBUser(model: RecordModel): BackendUser {
    return {
      id: model.id,
      email: model.email || '',
      name: model.name || '',
      photoURL: model.avatar ? this.pb.getFileUrl(model, model.avatar) : undefined,
    };
  }

  /**
   * Get current user ID (throws if not authenticated)
   */
  private getUserId(): string {
    const userId = this.pb.authStore.model?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return userId;
  }

  /**
   * Convert PocketBase workout record to WorkoutSession
   */
  private toWorkoutSession(record: PBWorkout): WorkoutSession {
    return {
      id: record.id,
      name: record.name,
      startTime: record.startTime,
      endTime: record.endTime,
      status: record.status,
      sourceTemplateId: record.sourceTemplateId,
      logs: record.logs || [],
      biometrics: record.biometrics,
    };
  }

  /**
   * Authentication
   */
  auth = {
    get isLoggedIn(): boolean {
      return this.pb.authStore.isValid;
    },

    get user(): BackendUser | null {
      return this.currentUser;
    },

    login: async (email: string, password: string, _rememberMe?: boolean): Promise<AuthResult> => {
      const authData = await this.pb.collection('users').authWithPassword(email, password);
      const user = this.mapPBUser(authData.record);
      this.currentUser = user;
      return { user, token: authData.token };
    },

    register: async (email: string, password: string, name: string, _rememberMe?: boolean): Promise<AuthResult> => {
      await this.pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      });

      // Auto-login after registration
      const authData = await this.pb.collection('users').authWithPassword(email, password);
      const user = this.mapPBUser(authData.record);
      this.currentUser = user;
      return { user, token: authData.token };
    },

    loginWithGoogle: async (_rememberMe?: boolean): Promise<AuthResult> => {
      // PocketBase supports OAuth2, but requires backend configuration
      const authData = await this.pb.collection('users').authWithOAuth2({ provider: 'google' });
      const user = this.mapPBUser(authData.record);
      this.currentUser = user;
      return { user, token: authData.token };
    },

    loginWithApple: async (_rememberMe?: boolean): Promise<AuthResult> => {
      // PocketBase supports OAuth2 for Apple
      const authData = await this.pb.collection('users').authWithOAuth2({ provider: 'apple' });
      const user = this.mapPBUser(authData.record);
      this.currentUser = user;
      return { user, token: authData.token };
    },

    logout: async (): Promise<void> => {
      this.pb.authStore.clear();
      this.currentUser = null;
    },

    onAuthChange: (callback: (user: BackendUser | null) => void): (() => void) => {
      return this.pb.authStore.onChange((token, model) => {
        const user = model ? this.mapPBUser(model) : null;
        this.currentUser = user;
        callback(user);
      });
    },
  };

  /**
   * Workouts
   */
  workouts = {
    getAll: async (): Promise<WorkoutSession[]> => {
      const userId = this.getUserId();
      const records = await this.pb.collection('workouts').getFullList<PBWorkout>({
        sort: '-startTime',
        filter: `user = "${userId}"`,
      });
      return records.map(r => this.toWorkoutSession(r));
    },

    getTemplates: async (): Promise<WorkoutSession[]> => {
      const userId = this.getUserId();
      const records = await this.pb.collection('workouts').getFullList<PBWorkout>({
        filter: `user = "${userId}" && status = "template"`,
      });
      return records.map(r => this.toWorkoutSession(r));
    },

    getHistory: async (): Promise<WorkoutSession[]> => {
      const userId = this.getUserId();
      const records = await this.pb.collection('workouts').getFullList<PBWorkout>({
        sort: '-startTime',
        filter: `user = "${userId}" && status = "completed"`,
      });
      return records.map(r => this.toWorkoutSession(r));
    },

    create: async (workout: WorkoutSession): Promise<WorkoutSession> => {
      const userId = this.getUserId();
      const record = await this.pb.collection('workouts').create<PBWorkout>({
        user: userId,
        name: workout.name,
        startTime: workout.startTime,
        endTime: workout.endTime,
        status: workout.status,
        sourceTemplateId: workout.sourceTemplateId,
        logs: workout.logs,
        biometrics: workout.biometrics,
      });
      return this.toWorkoutSession(record);
    },

    update: async (id: string, workout: Partial<WorkoutSession>): Promise<WorkoutSession> => {
      const record = await this.pb.collection('workouts').update<PBWorkout>(id, {
        name: workout.name,
        startTime: workout.startTime,
        endTime: workout.endTime,
        status: workout.status,
        logs: workout.logs,
        biometrics: workout.biometrics,
      });
      return this.toWorkoutSession(record);
    },

    delete: async (id: string): Promise<void> => {
      await this.pb.collection('workouts').delete(id);
    },

    subscribe: (callback: (action: 'create' | 'update' | 'delete', record: WorkoutSession) => void): (() => void) => {
      const userId = this.getUserId();

      this.pb.collection('workouts').subscribe<PBWorkout>('*', (e) => {
        if (e.record.user === userId) {
          const action = e.action as 'create' | 'update' | 'delete';
          callback(action, this.toWorkoutSession(e.record));
        }
      });

      return () => {
        this.pb.collection('workouts').unsubscribe('*');
      };
    },
  };

  /**
   * Settings
   */
  settings = {
    get: async (): Promise<UserSettings | null> => {
      try {
        const userId = this.getUserId();
        const records = await this.pb.collection('user_settings').getFullList<PBUserSettings>({
          filter: `user = "${userId}"`,
        });
        return records[0]?.settings || null;
      } catch {
        return null;
      }
    },

    save: async (settings: UserSettings): Promise<void> => {
      const userId = this.getUserId();
      const existing = await this.pb.collection('user_settings').getFullList<PBUserSettings>({
        filter: `user = "${userId}"`,
      });

      if (existing.length > 0) {
        await this.pb.collection('user_settings').update(existing[0].id, { settings });
      } else {
        await this.pb.collection('user_settings').create({
          user: userId,
          settings,
        });
      }
    },
  };

  /**
   * Daily Logs
   */
  dailyLogs = {
    getAll: async (): Promise<Record<string, DailyLog>> => {
      const userId = this.getUserId();
      const records = await this.pb.collection('daily_logs').getFullList<PBDailyLog>({
        filter: `user = "${userId}"`,
      });
      const result: Record<string, DailyLog> = {};
      records.forEach((r) => {
        result[r.date] = r.data;
      });
      return result;
    },

    save: async (date: string, data: DailyLog): Promise<void> => {
      const userId = this.getUserId();
      const existing = await this.pb.collection('daily_logs').getFullList<PBDailyLog>({
        filter: `user = "${userId}" && date = "${date}"`,
      });

      if (existing.length > 0) {
        await this.pb.collection('daily_logs').update(existing[0].id, { data });
      } else {
        await this.pb.collection('daily_logs').create({
          user: userId,
          date,
          data,
        });
      }
    },
  };

  /**
   * Programs
   */
  programs = {
    getAll: async (): Promise<Program[]> => {
      const userId = this.getUserId();
      const records = await this.pb.collection('programs').getFullList<PBProgram>({
        filter: `user = "${userId}"`,
      });
      return records.map(r => ({ ...r.program, id: r.id }));
    },

    create: async (program: Program): Promise<Program> => {
      const userId = this.getUserId();
      const record = await this.pb.collection('programs').create<PBProgram>({
        user: userId,
        program,
      });
      return { ...record.program, id: record.id };
    },

    update: async (id: string, program: Partial<Program>): Promise<Program> => {
      const record = await this.pb.collection('programs').update<PBProgram>(id, { program });
      return { ...record.program, id: record.id };
    },

    delete: async (id: string): Promise<void> => {
      await this.pb.collection('programs').delete(id);
    },
  };

  /**
   * Storage (using PocketBase file storage)
   */
  storage = {
    uploadImage: async (id: string, dataUrl: string): Promise<string> => {
      // PocketBase doesn't have direct base64 upload
      // Convert data URL to blob first
      const blob = await fetch(dataUrl).then(r => r.blob());
      const file = new File([blob], `${id}.png`, { type: 'image/png' });

      const userId = this.getUserId();

      // Create or update a record in exercise_images collection
      const formData = new FormData();
      formData.append('user', userId);
      formData.append('exerciseId', id);
      formData.append('image', file);

      const existing = await this.pb.collection('exercise_images').getFullList({
        filter: `user = "${userId}" && exerciseId = "${id}"`,
      });

      let record;
      if (existing.length > 0) {
        record = await this.pb.collection('exercise_images').update(existing[0].id, formData);
      } else {
        record = await this.pb.collection('exercise_images').create(formData);
      }

      // Return the file URL
      return this.pb.getFileUrl(record, record.image);
    },

    getImageUrl: async (id: string): Promise<string | null> => {
      try {
        const userId = this.getUserId();
        const records = await this.pb.collection('exercise_images').getFullList({
          filter: `user = "${userId}" && exerciseId = "${id}"`,
        });

        if (records.length === 0) return null;

        return this.pb.getFileUrl(records[0], records[0].image);
      } catch {
        return null;
      }
    },

    getAllImages: async (): Promise<Record<string, string>> => {
      const userId = this.getUserId();
      const records = await this.pb.collection('exercise_images').getFullList({
        filter: `user = "${userId}"`,
      });

      const images: Record<string, string> = {};
      records.forEach(record => {
        images[record.exerciseId] = this.pb.getFileUrl(record, record.image);
      });

      return images;
    },

    deleteImage: async (id: string): Promise<void> => {
      const userId = this.getUserId();
      const records = await this.pb.collection('exercise_images').getFullList({
        filter: `user = "${userId}" && exerciseId = "${id}"`,
      });

      if (records.length > 0) {
        await this.pb.collection('exercise_images').delete(records[0].id);
      }
    },
  };
}
