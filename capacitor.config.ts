import type { CapacitorConfig } from '@capacitor/cli';


const isDev = process.env.NODE_ENV === 'development' || process.env.CAPACITOR_DEV === 'true';
const devServerUrl = process.env.CAPACITOR_SERVER_URL || process.env.DEV_SERVER_URL || process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'lk.srisumana.erp',
  appName: 'ශ්‍රී සුමන මහා පිරිවෙන - මුද්දුව',
  webDir: 'dist',
  server: {
    // In production, url is omitted so local assets in dist/ are loaded securely.
    // In dev mode, url is only populated if explicitly supplied via environment variables.
    ...(devServerUrl ? { url: devServerUrl, cleartext: true } : { cleartext: false }),
    androidScheme: 'https',
    hostname: 'localhost',
    allowNavigation: [
      'srisumanamahapiriwena-lk.us.stackstaging.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdnjs.cloudflare.com',
      '*.onesignal.com',
      'onesignal.com',
      'generativelanguage.googleapis.com',
    ],
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: isDev && Boolean(devServerUrl),
    backgroundColor: '#1c1917',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#1c1917',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1c1917',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    CapacitorUpdater: {
      autoUpdate: false,
      resetWhenUpdate: false,
    },
  },
};

export default config;
