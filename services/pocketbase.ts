import PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import type { WorkoutSession, ExerciseLog, UserSettings, Program, DailyLog } from '../types';

// Configure this to your Unraid server address
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090';

export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation for better UX
pb.autoCancellation(false);

// Types for Pocketbase records
export interface PBWorkout extends RecordModel {
  user: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'template';
  sourceTemplateId?: string;
  logs: ExerciseLog[];
  biometrics?: { timestamp: number; heartRate: number }[];
}

export interface PBUserSettings extends RecordModel {
  user: string;
  settings: UserSettings;
}

export interface PBDailyLog extends RecordModel {
  user: string;
  date: string;
  data: DailyLog;
}

// Auth helpers
export const authService = {
  get isLoggedIn() {
    return pb.authStore.isValid;
  },

  get user() {
    return pb.authStore.model;
  },

  async login(email: string, password: string) {
    return await pb.collection('users').authWithPassword(email, password);
  },

  async register(email: string, password: string, name: string) {
    const user = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
    });
    // Auto-login after registration
    await this.login(email, password);
    return user;
  },

  async logout() {
    pb.authStore.clear();
  },

  onAuthChange(callback: (isValid: boolean) => void) {
    return pb.authStore.onChange((token, model) => {
      callback(pb.authStore.isValid);
    });
  },
};

// Workout sync helpers
export const workoutService = {
  async getAll(): Promise<WorkoutSession[]> {
    const records = await pb.collection('workouts').getFullList<PBWorkout>({
      sort: '-startTime',
      filter: `user = "${pb.authStore.model?.id}"`,
    });
    return records.map(this.toWorkoutSession);
  },

  async getTemplates(): Promise<WorkoutSession[]> {
    const records = await pb.collection('workouts').getFullList<PBWorkout>({
      filter: `user = "${pb.authStore.model?.id}" && status = "template"`,
    });
    return records.map(this.toWorkoutSession);
  },

  async getHistory(): Promise<WorkoutSession[]> {
    const records = await pb.collection('workouts').getFullList<PBWorkout>({
      sort: '-startTime',
      filter: `user = "${pb.authStore.model?.id}" && status = "completed"`,
    });
    return records.map(this.toWorkoutSession);
  },

  async create(workout: WorkoutSession): Promise<WorkoutSession> {
    const record = await pb.collection('workouts').create<PBWorkout>({
      user: pb.authStore.model?.id,
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

  async update(id: string, workout: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const record = await pb.collection('workouts').update<PBWorkout>(id, {
      name: workout.name,
      startTime: workout.startTime,
      endTime: workout.endTime,
      status: workout.status,
      logs: workout.logs,
      biometrics: workout.biometrics,
    });
    return this.toWorkoutSession(record);
  },

  async delete(id: string): Promise<void> {
    await pb.collection('workouts').delete(id);
  },

  toWorkoutSession(record: PBWorkout): WorkoutSession {
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
  },

  // Real-time subscription for multi-device sync
  subscribe(callback: (action: string, record: WorkoutSession) => void) {
    return pb.collection('workouts').subscribe<PBWorkout>('*', (e) => {
      if (e.record.user === pb.authStore.model?.id) {
        callback(e.action, this.toWorkoutSession(e.record));
      }
    });
  },

  unsubscribe() {
    pb.collection('workouts').unsubscribe('*');
  },
};

// User settings sync
export const settingsService = {
  async get(): Promise<UserSettings | null> {
    try {
      const records = await pb.collection('user_settings').getFullList<PBUserSettings>({
        filter: `user = "${pb.authStore.model?.id}"`,
      });
      return records[0]?.settings || null;
    } catch {
      return null;
    }
  },

  async save(settings: UserSettings): Promise<void> {
    const existing = await pb.collection('user_settings').getFullList<PBUserSettings>({
      filter: `user = "${pb.authStore.model?.id}"`,
    });

    if (existing.length > 0) {
      await pb.collection('user_settings').update(existing[0].id, { settings });
    } else {
      await pb.collection('user_settings').create({
        user: pb.authStore.model?.id,
        settings,
      });
    }
  },
};

// Daily bio logs sync
export const dailyLogService = {
  async getAll(): Promise<Record<string, DailyLog>> {
    const records = await pb.collection('daily_logs').getFullList<PBDailyLog>({
      filter: `user = "${pb.authStore.model?.id}"`,
    });
    const result: Record<string, DailyLog> = {};
    records.forEach((r) => {
      result[r.date] = r.data;
    });
    return result;
  },

  async save(date: string, data: DailyLog): Promise<void> {
    const existing = await pb.collection('daily_logs').getFullList<PBDailyLog>({
      filter: `user = "${pb.authStore.model?.id}" && date = "${date}"`,
    });

    if (existing.length > 0) {
      await pb.collection('daily_logs').update(existing[0].id, { data });
    } else {
      await pb.collection('daily_logs').create({
        user: pb.authStore.model?.id,
        date,
        data,
      });
    }
  },
};
