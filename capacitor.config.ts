import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focusloop.app',
  appName: 'FocusLoop',
  webDir: 'dist',
  server: {
    hostname: 'gen-lang-client-0554819453.firebaseapp.com',
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false
  }
};

export default config;
