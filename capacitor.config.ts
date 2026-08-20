import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.padalock.app',
  appName: 'PadaLock',
  webDir: 'public',
  server: {
    url: 'https://padalock-web.vercel.app/',
    cleartext: false
  }
};

export default config;
