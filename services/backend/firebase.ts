import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  FirebaseStorage,
} from 'firebase/storage';

import type { BackendService, BackendUser, AuthResult, BackendConfig } from './types';
import type { WorkoutSession, UserSettings, DailyLog, Program } from '../../types';

/**
 * Firebase backend implementation
 */
export class FirebaseBackend implements BackendService {
  private app: FirebaseApp;
  private authInstance: Auth;
  private db: Firestore;
  private storageInstance: FirebaseStorage;
  private currentUser: BackendUser | null = null;

  constructor(config: BackendConfig['firebase']) {
    if (!config) {
      throw new Error('Firebase configuration is required');
    }

    this.app = initializeApp(config);
    this.authInstance = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storageInstance = getStorage(this.app);

    // Initialize current user from Firebase Auth
    onAuthStateChanged(this.authInstance, (user) => {
      this.currentUser = user ? this.mapFirebaseUser(user) : null;
    });

    // Check for redirect result (Google Sign-In)
    this.checkRedirectResult();

    // Set up deep link handler for OAuth callback (Capacitor)
    this.setupDeepLinkHandler();
  }

  /**
   * Check for redirect result after Google Sign-In
   */
  private async checkRedirectResult() {
    try {
      const result = await getRedirectResult(this.authInstance);

      if (result) {
        console.log('✅ Google Sign-In redirect successful');
        const user = this.mapFirebaseUser(result.user);
        this.currentUser = user;

        // Create/update user document
        await setDoc(doc(this.db, 'users', result.user.uid), {
          email: user.email,
          name: user.name,
          photoURL: user.photoURL,
          lastLogin: Date.now(),
        }, { merge: true });

        // Clean up pending auth flag
        localStorage.removeItem('pendingAuthRememberMe');

        // Dispatch success event
        window.dispatchEvent(new CustomEvent('google-auth-success', {
          detail: { user }
        }));
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In redirect failed:', error);
      localStorage.removeItem('pendingAuthRememberMe');

      // Dispatch error event
      window.dispatchEvent(new CustomEvent('google-auth-error', {
        detail: { error }
      }));
    }
  }

  /**
   * Set up deep link handler for OAuth callback in Capacitor
   */
  private async setupDeepLinkHandler() {
    try {
      const { App } = await import('@capacitor/app');

      App.addListener('appUrlOpen', async (event) => {
        console.log('🔗 Deep link received:', event.url);

        // Check if this is a Google OAuth callback
        if (event.url.includes('google') || event.url.includes('oauth')) {
          // Extract the token from the URL if present
          const url = new URL(event.url);
          const idToken = url.searchParams.get('id_token') || url.hash.match(/id_token=([^&]+)/)?.[1];
          const accessToken = url.searchParams.get('access_token') || url.hash.match(/access_token=([^&]+)/)?.[1];

          if (idToken || accessToken) {
            try {
              const credential = GoogleAuthProvider.credential(idToken, accessToken);
              const result = await signInWithCredential(this.authInstance, credential);
              console.log('✅ Google Sign-In via deep link successful');

              const user = this.mapFirebaseUser(result.user);
              this.currentUser = user;

              // Create/update user document
              await setDoc(doc(this.db, 'users', result.user.uid), {
                email: user.email,
                name: user.name,
                photoURL: user.photoURL,
                lastLogin: Date.now(),
              }, { merge: true });

              // Dispatch event to notify the app
              window.dispatchEvent(new CustomEvent('google-auth-success', { detail: { user } }));
            } catch (error) {
              console.error('❌ Failed to sign in with credential:', error);
              window.dispatchEvent(new CustomEvent('google-auth-error', { detail: { error } }));
            }
          }
        }
      });
    } catch (e) {
      // Not in Capacitor environment
      console.log('Deep link handler not available (web environment)');
    }
  }

  /**
   * Map Firebase user to BackendUser
   */
  private mapFirebaseUser(user: FirebaseUser): BackendUser {
    return {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || '',
      photoURL: user.photoURL || undefined,
    };
  }

  /**
   * Get current user ID (throws if not authenticated)
   */
  private getUserId(): string {
    const userId = this.authInstance.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return userId;
  }

  /**
   * Authentication
   */
  auth = {
    get isLoggedIn(): boolean {
      // Check both this.currentUser (set by onAuthStateChanged) and authInstance.currentUser
      // this.currentUser is more reliable as it's set by the auth state listener
      const currentUser = (this as any).currentUser;
      const instance = (this as any).authInstance;
      return !!(currentUser || (instance && instance.currentUser));
    },

    get user(): BackendUser | null {
      return (this as any).currentUser;
    },

    login: async (email: string, password: string, rememberMe: boolean = true): Promise<AuthResult> => {
      // Set persistence BEFORE signing in
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(this.authInstance, persistence);

      const credential = await signInWithEmailAndPassword(this.authInstance, email, password);
      const user = this.mapFirebaseUser(credential.user);
      this.currentUser = user;
      return { user, token: await credential.user.getIdToken() };
    },

    register: async (email: string, password: string, name: string, rememberMe: boolean = true): Promise<AuthResult> => {
      // Set persistence BEFORE signing up
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(this.authInstance, persistence);

      const credential = await createUserWithEmailAndPassword(this.authInstance, email, password);

      // Set display name
      await updateProfile(credential.user, { displayName: name });

      const user = this.mapFirebaseUser(credential.user);
      this.currentUser = user;

      // Create initial user document
      await setDoc(doc(this.db, 'users', credential.user.uid), {
        email,
        name,
        createdAt: Date.now(),
      });

      return { user, token: await credential.user.getIdToken() };
    },

    loginWithGoogle: async (rememberMe: boolean = true): Promise<AuthResult> => {
      // Set persistence BEFORE signing in
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(this.authInstance, persistence);

      const provider = new GoogleAuthProvider();

      // Detect if running in Capacitor (native app)
      const isNative = !!(window as any).Capacitor;

      if (isNative) {
        // For iOS/native apps, use redirect flow (popups don't work in WKWebView)
        console.log('📱 Using Google Sign-In redirect for native app');

        // Store rememberMe preference for after redirect
        localStorage.setItem('pendingAuthRememberMe', rememberMe.toString());

        // Trigger redirect to Google Sign-In
        await signInWithRedirect(this.authInstance, provider);

        // This function won't return - the app will redirect to Google
        // The result will be handled by checkRedirectResult() when app resumes
        throw new Error('REDIRECT_PENDING');
      } else {
        // Use popup for web
        console.log('🪟 Using signInWithPopup for web');
        const credential = await signInWithPopup(this.authInstance, provider);
        const user = this.mapFirebaseUser(credential.user);
        this.currentUser = user;

        // Create/update user document
        await setDoc(doc(this.db, 'users', credential.user.uid), {
          email: user.email,
          name: user.name,
          photoURL: user.photoURL,
          lastLogin: Date.now(),
        }, { merge: true });

        return { user, token: await credential.user.getIdToken() };
      }
    },

    loginWithApple: async (rememberMe: boolean = true): Promise<AuthResult> => {
      // Set persistence BEFORE signing in
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(this.authInstance, persistence);

      // Apple Sign-In requires additional setup and OAuthProvider
      // For now, throw not implemented
      throw new Error('Apple Sign-In not yet implemented. Requires Apple Developer account setup.');
    },

    logout: async (): Promise<void> => {
      await signOut(this.authInstance);
      this.currentUser = null;
    },

    onAuthChange: (callback: (user: BackendUser | null) => void): (() => void) => {
      return onAuthStateChanged(this.authInstance, (firebaseUser) => {
        const user = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
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
      const q = query(
        collection(this.db, 'workouts'),
        where('userId', '==', userId),
        orderBy('startTime', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WorkoutSession));
    },

    getTemplates: async (): Promise<WorkoutSession[]> => {
      const userId = this.getUserId();
      const q = query(
        collection(this.db, 'workouts'),
        where('userId', '==', userId),
        where('status', '==', 'template')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WorkoutSession));
    },

    getHistory: async (): Promise<WorkoutSession[]> => {
      const userId = this.getUserId();
      const q = query(
        collection(this.db, 'workouts'),
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('startTime', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WorkoutSession));
    },

    create: async (workout: WorkoutSession): Promise<WorkoutSession> => {
      const userId = this.getUserId();
      const workoutData = { ...workout, userId };

      // Use workout.id to preserve document ID (upsert logic)
      const docRef = workout.id
        ? doc(this.db, 'workouts', workout.id)
        : doc(collection(this.db, 'workouts'));

      await setDoc(docRef, workoutData, { merge: true });
      return { ...workoutData, id: docRef.id };
    },

    update: async (id: string, workout: Partial<WorkoutSession>): Promise<WorkoutSession> => {
      const docRef = doc(this.db, 'workouts', id);
      await updateDoc(docRef, workout as any);
      const updated = await getDoc(docRef);
      return { ...updated.data(), id: updated.id } as WorkoutSession;
    },

    delete: async (id: string): Promise<void> => {
      await deleteDoc(doc(this.db, 'workouts', id));
    },

    subscribe: (callback: (action: 'create' | 'update' | 'delete', record: WorkoutSession) => void): (() => void) => {
      const userId = this.getUserId();
      const q = query(
        collection(this.db, 'workouts'),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = { ...change.doc.data(), id: change.doc.id } as WorkoutSession;

          if (change.type === 'added') {
            callback('create', data);
          } else if (change.type === 'modified') {
            callback('update', data);
          } else if (change.type === 'removed') {
            callback('delete', data);
          }
        });
      });

      return unsubscribe;
    },
  };

  /**
   * Settings
   */
  settings = {
    get: async (): Promise<UserSettings | null> => {
      const userId = this.getUserId();
      const docRef = doc(this.db, 'settings', userId);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? (snapshot.data() as UserSettings) : null;
    },

    save: async (settings: UserSettings): Promise<void> => {
      const userId = this.getUserId();
      const docRef = doc(this.db, 'settings', userId);
      await setDoc(docRef, settings, { merge: true });
    },
  };

  /**
   * Daily Logs
   */
  dailyLogs = {
    getAll: async (): Promise<Record<string, DailyLog>> => {
      const userId = this.getUserId();
      const q = query(
        collection(this.db, 'dailyLogs'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const logs: Record<string, DailyLog> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        logs[data.date] = data.log as DailyLog;
      });
      return logs;
    },

    save: async (date: string, log: DailyLog): Promise<void> => {
      const userId = this.getUserId();
      const docRef = doc(this.db, 'dailyLogs', `${userId}_${date}`);
      await setDoc(docRef, { userId, date, log }, { merge: true });
    },
  };

  /**
   * Programs
   */
  programs = {
    getAll: async (): Promise<Program[]> => {
      const userId = this.getUserId();
      const q = query(
        collection(this.db, 'programs'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Program));
    },

    create: async (program: Program): Promise<Program> => {
      const userId = this.getUserId();
      const programData = { ...program, userId };

      // Use program.id to preserve document ID (upsert logic)
      const docRef = program.id
        ? doc(this.db, 'programs', program.id)
        : doc(collection(this.db, 'programs'));

      await setDoc(docRef, programData, { merge: true });
      return { ...programData, id: docRef.id };
    },

    update: async (id: string, program: Partial<Program>): Promise<Program> => {
      const docRef = doc(this.db, 'programs', id);
      await updateDoc(docRef, program as any);
      const updated = await getDoc(docRef);
      return { ...updated.data(), id: updated.id } as Program;
    },

    delete: async (id: string): Promise<void> => {
      await deleteDoc(doc(this.db, 'programs', id));
    },
  };

  /**
   * Storage (for exercise images)
   */
  storage = {
    uploadImage: async (id: string, dataUrl: string): Promise<string> => {
      const userId = this.getUserId();
      const storageRef = ref(this.storageInstance, `users/${userId}/exercise-images/${id}`);

      // Upload base64 data URL
      await uploadString(storageRef, dataUrl, 'data_url');

      // Get public URL
      const url = await getDownloadURL(storageRef);
      return url;
    },

    getImageUrl: async (id: string): Promise<string | null> => {
      try {
        const userId = this.getUserId();
        const storageRef = ref(this.storageInstance, `users/${userId}/exercise-images/${id}`);
        return await getDownloadURL(storageRef);
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          return null;
        }
        throw error;
      }
    },

    getAllImages: async (): Promise<Record<string, string>> => {
      const userId = this.getUserId();
      const listRef = ref(this.storageInstance, `users/${userId}/exercise-images`);
      const list = await listAll(listRef);

      const images: Record<string, string> = {};
      await Promise.all(
        list.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const id = itemRef.name;
          images[id] = url;
        })
      );

      return images;
    },

    deleteImage: async (id: string): Promise<void> => {
      const userId = this.getUserId();
      const storageRef = ref(this.storageInstance, `users/${userId}/exercise-images/${id}`);
      await deleteObject(storageRef);
    },
  };
}
