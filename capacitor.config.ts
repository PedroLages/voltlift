import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ironpath.app',
  appName: 'IronPath',
  webDir: 'dist',
  server: {
    // PRODUCTION: Load from Firebase Hosting (auto-updates)
    url: 'https://voltlift-app.web.app',
    cleartext: false,

    // DEVELOPMENT: Uncomment for local development
    // url: 'http://192.168.2.233:3002',
    // cleartext: true
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
  },
};

export default config;
