import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voltlift.app',
  appName: 'VoltLift',
  webDir: 'dist',
  // TEMPORARILY DISABLED FOR TESTING HEALTHKIT PLUGIN
  // server: {
  //   // PRODUCTION: Load from Vercel (auto-updates, preview URLs on PRs)
  //   url: 'https://voltlift.vercel.app',
  //   cleartext: false,
  //
  //   // DEVELOPMENT: Use Mac's local IP so iPhone can connect
  //   // url: 'http://192.168.2.233:3000',
  //   // cleartext: true
  // },
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
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
