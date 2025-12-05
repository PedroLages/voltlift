import { FirebaseBackend } from './firebase';
import { PocketBaseBackend } from './pocketbase';
import type { BackendService, BackendConfig } from './types';

/**
 * Get backend configuration from environment variables
 */
function getBackendConfig(): BackendConfig {
  const backendType = import.meta.env.VITE_BACKEND_TYPE || 'firebase';

  if (backendType === 'firebase') {
    return {
      type: 'firebase',
      firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      },
    };
  }

  if (backendType === 'pocketbase') {
    return {
      type: 'pocketbase',
      pocketbase: {
        url: import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090',
      },
    };
  }

  throw new Error(`Unknown backend type: ${backendType}`);
}

/**
 * Create backend instance based on configuration
 */
function createBackend(): BackendService {
  const config = getBackendConfig();

  console.log(`🔥 Initializing ${config.type} backend...`);

  if (config.type === 'firebase') {
    return new FirebaseBackend(config.firebase);
  }

  if (config.type === 'pocketbase') {
    return new PocketBaseBackend(config.pocketbase);
  }

  throw new Error(`Unsupported backend type: ${config.type}`);
}

/**
 * Singleton backend instance
 * This is the main export that the rest of the app uses
 */
export const backend = createBackend();

/**
 * Re-export types for convenience
 */
export type { BackendService, BackendUser, AuthResult, BackendConfig } from './types';
